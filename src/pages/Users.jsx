import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  UserPlus, Search, Edit3, Trash2, Users as UsersIcon, 
  X, RefreshCw, Check, Shield 
} from 'lucide-react';
import { showToast, showAlert, showConfirm } from '../utils/sweetalert';

export default function Users() {
  const [users, setUsers] = useState([]);
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

  // State Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'cashier', // 'admin' atau 'cashier'
    password: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      // Mendukung response pagination maupun non-pagination dari Laravel
      const usersArray = res.data?.data?.data || res.data?.data || res.data || [];
      setUsers(Array.isArray(usersArray) ? usersArray : []);
    } catch (err) {
      console.error('Gagal mengambil data user:', err);
      showToast('Gagal memuat data pengguna', 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setIsEditing(true);
      setEditId(user.id);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'cashier',
        password: '', // Biarkan kosong jika tidak ingin mengubah password
      });
    } else {
      setIsEditing(false);
      setEditId(null);
      setFormData({
        name: '',
        email: '',
        role: 'cashier',
        password: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      
      // Jika edit dan password kosong, hapus field password agar tidak di-update
      if (isEditing && !payload.password) {
        delete payload.password;
      }

      if (isEditing) {
        await api.put(`/users/${editId}`, payload);
        showToast('Data pengguna berhasil diperbarui!', 'success');
      } else {
        await api.post('/users', payload);
        showToast('Pengguna baru berhasil ditambahkan!', 'success');
      }

      handleCloseModal();
      fetchUsers();
    } catch (err) {
      if (err.response && err.response.status === 422) {
        const validationErrors = err.response.data.errors;
        const messages = validationErrors 
          ? Object.values(validationErrors).flat().join('<br/>') 
          : err.response.data.message;
        
        showAlert('Gagal Validasi', messages, 'error');
      } else {
        showAlert('Gagal Menyimpan', err.response?.data?.message || 'Gagal menyimpan data pengguna.', 'error');
      }
    }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await showConfirm(
      'Hapus Pengguna?',
      `Apakah Anda yakin ingin menghapus akun "${name}"?`,
      'Ya, Hapus',
      'Batal'
    );

    if (isConfirmed) {
      try {
        await api.delete(`/users/${id}`);
        showToast('Pengguna berhasil dihapus', 'success');
        fetchUsers();
      } catch (err) {
        showAlert('Gagal Hapus', err.response?.data?.message || 'Gagal menghapus pengguna.', 'error');
      }
    }
  };

  const filteredUsers = Array.isArray(users) 
    ? users.filter((u) => 
        (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div style={styles.container}>
      {/* HEADER PAGE (RESPONSIF MOBILE / PC) */}
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
          <h1 style={styles.title}>Manajemen Pengguna</h1>
          <p style={styles.subtitle}>Kelola akun pengguna dan hak akses aplikasi POS.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={fetchUsers} style={styles.btnSecondary} title="Refresh Data">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => handleOpenModal()} style={styles.btnPrimary}>
            <UserPlus size={18} /> Tambah Pengguna
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Cari nama atau email pengguna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* TABEL USERS */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.loadingText}>Memuat data pengguna...</div>
        ) : filteredUsers.length === 0 ? (
          <div style={styles.emptyText}>
            <UsersIcon size={48} color="#cbd5e1" />
            <p>Tidak ada pengguna yang ditemukan.</p>
          </div>
        ) : (
          /* KONTROL SCROLL UTAMA JIKA DATA > 10 */
          <div style={styles.tableScrollContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nama</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role / Hak Akses</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={styles.tr}>
                    <td style={styles.tdName}>{u.name}</td>
                    <td style={styles.td}>{u.email}</td>
                    <td style={styles.td}>
                      <span style={styles.roleBadge(u.role === 'admin')}>
                        <Shield size={12} />
                        {u.role === 'admin' ? 'Administrator' : 'Kasir'}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                        <button onClick={() => handleOpenModal(u)} style={styles.actionBtnEdit} title="Edit">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDelete(u.id, u.name)} style={styles.actionBtnDelete} title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM TAMBAH / EDIT */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>
                {isEditing ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button onClick={handleCloseModal} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contoh@email.com"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Role / Peran *</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={styles.input}
                >
                  <option value="cashier">Kasir (Hanya POS & Struk)</option>
                  <option value="admin">Administrator (Akses Penuh)</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  {isEditing ? 'Password Baru (Kosongkan jika tidak diganti)' : 'Password *'}
                </label>
                <input
                  type="password"
                  required={!isEditing}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="******"
                  style={styles.input}
                />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={handleCloseModal} style={styles.btnSecondary}>
                  Batal
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  <Check size={18} /> {isEditing ? 'Simpan Perubahan' : 'Tambah User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Styles
const styles = {
  container: { padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
  header: { display: 'flex', marginBottom: '20px' },
  title: { margin: 0, fontSize: '24px', fontWeight: '700', color: '#0f172a' },
  subtitle: { margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' },
  btnPrimary: { padding: '10px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  btnSecondary: { padding: '10px 14px', backgroundColor: '#fff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  filterBar: { marginBottom: '20px' },
  searchBox: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '12px', color: '#64748b' },
  searchInput: { width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' },
  tableCard: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  
  tableScrollContainer: {
    maxHeight: '550px',
    overflowY: 'auto',
    overflowX: 'auto',
  },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { 
    backgroundColor: '#f1f5f9', 
    padding: '12px 16px', 
    fontSize: '13px', 
    color: '#475569', 
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 1,
    whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#334155', whiteSpace: 'nowrap' },
  tdName: { padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap' },
  roleBadge: (isAdmin) => ({
    display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px',
    fontSize: '12px', fontWeight: '600',
    backgroundColor: isAdmin ? '#eff6ff' : '#f1f5f9',
    color: isAdmin ? '#2563eb' : '#475569',
  }),
  actionBtnEdit: { padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#2563eb', cursor: 'pointer' },
  actionBtnDelete: { padding: '6px', borderRadius: '6px', border: '1px solid #fca5a5', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer' },
  loadingText: { textAlign: 'center', padding: '40px', color: '#64748b' },
  emptyText: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', color: '#94a3b8' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', width: '100%', maxWidth: '440px', borderRadius: '12px', padding: '24px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#334155' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' },
};