import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Store, Save, RefreshCw, Upload, Building, Phone, Mail, MapPin, FileText, Trash2 } from 'lucide-react';
import { showToast, showAlert } from '../utils/sweetalert';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  // DETEKSI UKURAN LAYAR (RESPONSIF MOBILE / PC)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formData, setFormData] = useState({
    store_name: '',
    store_tagline: '',
    store_address: '',
    store_phone: '',
    store_email: '',
    receipt_footer_text: '',
  });

  // HELPER PERBAIKAN URL GAMBAR (.ENV WITH FALLBACK TO MANUAL LINK)
  const getImageUrl = (path) => {
    if (!path) return null;

    // Jika dari backend sudah berupa URL absolut https:// yang valid (tidak terpotong)
    if (path.startsWith('http://') || path.startsWith('https://')) {
      // Cegah bug domain terpotong "https://.firza-portofolio..."
      if (path.includes('://.firza')) {
        return path.replace('://.firza', '://api.firza');
      }
      return path;
    }

    // Ambil base domain dari .env VITE_API_URL, jika kosong / bermasalah gunakan manual URL
    let baseUrl = import.meta.env.VITE_API_URL || 'https://api.firza-portofolio.my.id';
    
    // Hapus suffix '/api' dari base URL jika ada
    baseUrl = baseUrl.replace(/\/api\/?$/, '');

    // Pastikan tidak ada bug domain terpotong
    if (baseUrl.includes('://.firza')) {
      baseUrl = baseUrl.replace('://.firza', '://api.firza');
    }

    // Pastikan path berawalan slash /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // Gabungkan domain + path storage
    return `${baseUrl}/storage${cleanPath.replace('/storage', '')}`;
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      const data = res.data?.data || {};
      setFormData({
        store_name: data.store_name || '',
        store_tagline: data.store_tagline || '',
        store_address: data.store_address || '',
        store_phone: data.store_phone || '',
        store_email: data.store_email || '',
        receipt_footer_text: data.receipt_footer_text || '',
      });

      if (data.store_logo) {
        setLogoPreview(getImageUrl(data.store_logo));
      } else {
        setLogoPreview(null);
      }
      setLogoFile(null);
      setRemoveLogo(false);
    } catch (err) {
      console.error('Gagal mengambil pengaturan toko:', err);
      showToast('Gagal memuat pengaturan toko', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setRemoveLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    setRemoveLogo(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('store_name', formData.store_name);
      payload.append('store_tagline', formData.store_tagline);
      payload.append('store_address', formData.store_address);
      payload.append('store_phone', formData.store_phone);
      payload.append('store_email', formData.store_email);
      payload.append('receipt_footer_text', formData.receipt_footer_text);
      
      if (logoFile) {
        payload.append('store_logo', logoFile);
      }

      if (removeLogo) {
        payload.append('remove_logo', '1');
      }

      await api.post('/settings', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast('Identitas toko berhasil diperbarui!', 'success');
      fetchSettings();
    } catch (err) {
      showAlert('Gagal Menyimpan', err.response?.data?.message || 'Terjadi kesalahan saat menyimpan.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Memuat identitas toko...</div>;
  }

  return (
    <div style={styles.container}>
      {/* HEADER PAGE */}
      <div 
        style={{
          ...styles.header,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: isMobile ? 'flex-start' : 'space-between',
          gap: isMobile ? '12px' : '16px',
        }}
      >
        <div>
          <h1 style={styles.title}>Identitas Toko</h1>
          <p style={styles.subtitle}>Kelola informasi bisnis, logo, dan teks footer pada struk transaksi.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={fetchSettings} style={styles.btnSecondary} title="Refresh Data">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* FORM PENGATURAN */}
      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr', gap: '24px' }}>
          
          {/* UPLOAD & HAPUS LOGO */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Logo Toko</label>
            <div style={styles.logoBox}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo Toko" style={styles.logoImg} />
              ) : (
                <Store size={48} color="#cbd5e1" />
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <label style={styles.uploadBtn}>
                <Upload size={14} /> {logoPreview ? 'Ganti' : 'Pilih Logo'}
                <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
              </label>

              {logoPreview && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  style={styles.deleteBtn}
                  title="Hapus Logo Toko"
                >
                  <Trash2 size={14} /> Hapus
                </button>
              )}
            </div>

            <small style={{ color: '#94a3b8', fontSize: '11px', textAlign: 'center' }}>
              Format: JPG, PNG (Max 2MB)
            </small>
          </div>

          {/* INPUT FORM DETAIL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={styles.formGroup}>
              <label style={styles.label}><Building size={16} /> Nama Toko / Usaha *</label>
              <input
                type="text"
                required
                value={formData.store_name}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                placeholder="Contoh: Toko Berkah Jaya"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Slogan / Tagline</label>
              <input
                type="text"
                value={formData.store_tagline}
                onChange={(e) => setFormData({ ...formData, store_tagline: e.target.value })}
                placeholder="Contoh: Solusi Belanja Hemat & Lengkap"
                style={styles.input}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
              <div style={styles.formGroup}>
                <label style={styles.label}><Phone size={16} /> No. Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={formData.store_phone}
                  onChange={(e) => setFormData({ ...formData, store_phone: e.target.value })}
                  placeholder="081234567890"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}><Mail size={16} /> Email Toko</label>
                <input
                  type="email"
                  value={formData.store_email}
                  onChange={(e) => setFormData({ ...formData, store_email: e.target.value })}
                  placeholder="info@tokoberkah.com"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}><MapPin size={16} /> Alamat Lengkap Toko</label>
              <textarea
                rows="3"
                value={formData.store_address}
                onChange={(e) => setFormData({ ...formData, store_address: e.target.value })}
                placeholder="Jl. Merdeka No. 123, Jakarta Selatan"
                style={{ ...styles.input, resize: 'vertical' }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}><FileText size={16} /> Teks Catatan Struk (Footer Struk)</label>
              <textarea
                rows="2"
                value={formData.receipt_footer_text}
                onChange={(e) => setFormData({ ...formData, receipt_footer_text: e.target.value })}
                placeholder="Contoh: Barang yang sudah dibeli tidak dapat ditukar/dikembalikan."
                style={{ ...styles.input, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" style={styles.btnPrimary} disabled={submitting}>
                <Save size={18} /> {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: { padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
  header: { display: 'flex', marginBottom: '20px' },
  title: { margin: 0, fontSize: '24px', fontWeight: '700', color: '#0f172a' },
  subtitle: { margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' },
  btnPrimary: { padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  btnSecondary: { padding: '10px 14px', backgroundColor: '#fff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  card: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' },
  logoBox: { width: '140px', height: '140px', borderRadius: '12px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', overflow: 'hidden' },
  logoImg: { width: '100%', height: '100%', objectFit: 'cover' },
  uploadBtn: { padding: '6px 12px', backgroundColor: '#f1f5f9', color: '#334155', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #cbd5e1' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #fecaca' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
};