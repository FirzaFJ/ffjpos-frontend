import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit2, Trash2, Search, Loader2, RefreshCw } from 'lucide-react';
import { showToast, showAlert, showConfirm } from '../utils/sweetalert';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // DETEKSI UKURAN LAYAR (RESPONSIF MOBILE / PC)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // State Form / Modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Data Kategori dari Backend
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      // Menyesuaikan struktur respon Laravel (res.data.data atau res.data)
      const data = res.data.data || res.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Gagal mengambil data kategori:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle Tambah / Edit Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      if (editId) {
        // Update Kategori
        await api.put(`/categories/${editId}`, formData);
        showToast('Kategori berhasil diperbarui!', 'success');
      } else {
        // Tambah Kategori Baru
        await api.post('/categories', formData);
        showToast('Kategori baru berhasil ditambahkan!', 'success');
      }
      
      handleCloseModal();
      fetchCategories();
    } catch (err) {
      if (err.response && err.response.status === 422) {
        const validationErrors = err.response.data.errors;
        const messages = validationErrors 
          ? Object.values(validationErrors).flat().join('<br/>') 
          : err.response.data.message;
        
        setErrorMsg(messages);
        showAlert('Gagal Validasi', messages, 'error');
      } else {
        const message = err.response?.data?.message || 'Gagal menyimpan kategori.';
        setErrorMsg(message);
        showAlert('Gagal Menyimpan', message, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Open Modal Tambah
  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({ name: '', description: '' });
    setErrorMsg('');
    setShowModal(true);
  };

  // Open Modal Edit
  const handleOpenEdit = (category) => {
    setEditId(category.id);
    setFormData({
      name: category.name || '',
      description: category.description || '',
    });
    setErrorMsg('');
    setShowModal(true);
  };

  // Close Modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormData({ name: '', description: '' });
    setErrorMsg('');
  };

  // Delete Kategori
  const handleDelete = async (id, name) => {
    // Menggunakan dialog konfirmasi SweetAlert2
    const isConfirmed = await showConfirm(
      'Hapus Kategori?',
      `Apakah Anda yakin ingin menghapus kategori "${name}"?`,
      'Ya, Hapus',
      'Batal'
    );

    if (isConfirmed) {
      try {
        await api.delete(`/categories/${id}`);
        showToast('Kategori berhasil dihapus', 'success');
        fetchCategories();
      } catch (err) {
        showAlert('Gagal Hapus', err.response?.data?.message || 'Gagal menghapus kategori.', 'error');
      }
    }
  };

  // Filter Search
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container}>
      {/* HEADER RESPONSIF */}
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
          <h1 style={styles.title}>Manajemen Kategori</h1>
          <p style={styles.subtitle}>Kelola kategori produk toko Anda</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={fetchCategories} style={styles.btnSecondary} title="Refresh Data">
                <RefreshCw size={16} />
            </button>

            <button style={styles.btnAdd} onClick={handleOpenAdd} title="Tambah Kategori">
                <Plus size={18} />
                <span>Tambah Kategori</span>
            </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div style={styles.card}>
        <div style={styles.searchBox}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Cari nama kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* TABEL KATEGORI */}
        {loading ? (
          <div style={styles.loadingContainer}>
            <Loader2 style={styles.spinner} size={32} />
            <p>Memuat data kategori...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>No</th>
                  <th style={styles.th}>Nama Kategori</th>
                  {/* <th style={styles.th}>Deskripsi</th> */}
                  <th style={{ ...styles.th, textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((item, index) => (
                    <tr key={item.id} style={styles.tr}>
                      <td style={styles.td}>{index + 1}</td>
                      <td style={{ ...styles.td, fontWeight: '600' }}>{item.name}</td>
                      
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <div style={styles.actionGroup}>
                          <button
                            style={styles.btnEdit}
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Kategori"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            style={styles.btnDelete}
                            onClick={() => handleDelete(item.id, item.name)}
                            title="Hapus Kategori"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={styles.emptyTd}>
                      Tidak ada data kategori ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM TAMBAH / EDIT */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>
              {editId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </h3>

            {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nama Kategori *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Makanan, Minuman, SnackBar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={styles.input}
                />
              </div>

              {/* <div style={styles.formGroup}>
                <label style={styles.label}>Deskripsi (Opsional)</label>
                <textarea
                  rows="3"
                  placeholder="Keterangan singkat kategori..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ ...styles.input, resize: 'vertical' }}
                />
              </div> */}

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={styles.btnCancel}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button type="submit" style={styles.btnSave} disabled={submitting}>
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 },
  subtitle: { color: '#64748b', fontSize: '14px', marginTop: '4px' },
  btnAdd: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  searchBox: { display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '8px 14px', borderRadius: '8px', marginBottom: '20px', width: '100%', maxWidth: '300px', boxSizing: 'border-box' },
  searchIcon: { color: '#94a3b8', marginRight: '8px' },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' },
  loadingContainer: { textAlign: 'center', padding: '40px', color: '#64748b' },
  spinner: { animation: 'spin 1s linear infinite', marginBottom: '8px' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  th: { padding: '12px 16px', backgroundColor: '#f8fafc', color: '#475569', fontWeight: '600', borderBottom: '1px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 16px', color: '#334155' },
  emptyTd: { padding: '30px', textAlign: 'center', color: '#94a3b8' },
  actionGroup: { display: 'flex', justifyContent: 'center', gap: '8px' },
  btnEdit: { backgroundColor: '#e0f2fe', color: '#0284c7', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
  btnDelete: { backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', width: '100%', maxWidth: '450px', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  modalTitle: { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' },
  errorAlert: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '6px', fontSize: '14px', marginBottom: '14px' },
  formGroup: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#334155', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
  btnCancel: { backgroundColor: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  btnSave: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  btnSecondary: {
    padding: '10px 14px',
    backgroundColor: '#ffffff',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
};