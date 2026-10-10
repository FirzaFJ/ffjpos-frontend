import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  Plus, Search, Edit3, Trash2, Package, 
  X, AlertTriangle, RefreshCw, Check, ArrowDownToLine, ArrowUpFromLine
} from 'lucide-react';
import { showToast, showAlert, showConfirm } from '../utils/sweetalert';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
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

  // State Filter & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // State Modal Form (Tambah / Edit Informasi Produk)
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    cost_price: '',
  });

  // State Modal Restock (Stok Masuk)
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockData, setRestockData] = useState({ qty: '', cost_price: '', notes: '' });
  const [isSubmittingRestock, setIsSubmittingRestock] = useState(false);

  // State Modal Stok Out (Koreksi Pengurangan)
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [stockOutProduct, setStockOutProduct] = useState(null);
  const [stockOutData, setStockOutData] = useState({ qty: '', notes: '' });
  const [isSubmittingStockOut, setIsSubmittingStockOut] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resProd, resCat] = await Promise.all([
        api.get('/products').catch(() => ({ data: { data: [] } })),
        api.get('/categories').catch(() => ({ data: { data: [] } }))
      ]);

      setProducts(resProd.data.data || resProd.data || []);
      setCategories(resCat.data.data || resCat.data || []);
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handler Modal Tambah / Edit Produk
  const handleOpenModal = (product = null) => {
    if (product) {
      setIsEditing(true);
      setEditId(product.id);
      setFormData({
        name: product.name || '',
        category_id: product.category_id || '',
        price: product.price || '',
        cost_price: product.cost_price || '',
      });
    } else {
      setIsEditing(false);
      setEditId(null);
      setFormData({
        name: '',
        category_id: '',
        price: '',
        cost_price: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  // Handler Restock (Stok Masuk)
  const handleOpenRestock = (product) => {
    setRestockProduct(product);
    setRestockData({ qty: '', cost_price: product.cost_price || '', notes: '' });
    setShowRestockModal(true);
  };
  const handleCloseRestockModal = () => {
    setShowRestockModal(false);
    setRestockProduct(null);
  };

  // Handler Stok Out (Pengurangan Stok)
  const handleOpenStockOut = (product) => {
    setStockOutProduct(product);
    setStockOutData({ qty: '', notes: '' });
    setShowStockOutModal(true);
  };
  const handleCloseStockOutModal = () => {
    setShowStockOutModal(false);
    setStockOutProduct(null);
  };

  // Submit Tambah / Edit Produk
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        category_id: parseInt(formData.category_id),
        price: parseFloat(formData.price),
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : 0,
      };

      if (isEditing) {
        await api.put(`/products/${editId}`, payload);
        showToast('Informasi produk berhasil diperbarui!', 'success');
      } else {
        await api.post('/products', payload);
        showToast('Produk baru berhasil ditambahkan (Stok Awal: 0)!', 'success');
      }

      handleCloseModal();
      fetchData();
    } catch (err) {
      if (err.response && err.response.status === 422) {
        const validationErrors = err.response.data.errors;
        const messages = validationErrors 
          ? Object.values(validationErrors).flat().join('<br/>') 
          : err.response.data.message;
        showAlert('Gagal Validasi', messages, 'error');
      } else {
        showAlert('Gagal Menyimpan', err.response?.data?.message || 'Gagal menyimpan data produk.', 'error');
      }
    }
  };

  // Submit Restock (Stok Masuk)
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockData.qty || parseInt(restockData.qty) <= 0) {
      showAlert('Peringatan', 'Jumlah stok masuk harus lebih besar dari 0', 'warning');
      return;
    }

    setIsSubmittingRestock(true);
    try {
      const payload = {
        notes: restockData.notes || `Restock Produk ${restockProduct.name}`,
        items: [
          {
            product_id: restockProduct.id,
            qty: parseInt(restockData.qty),
            cost_price: parseFloat(restockData.cost_price || 0),
          }
        ]
      };

      await api.post('/stock-ins', payload);
      showToast(`Stok ${restockProduct.name} berhasil ditambah!`, 'success');
      handleCloseRestockModal();
      fetchData();
    } catch (err) {
      showAlert('Gagal Restock', err.response?.data?.message || 'Gagal menambah stok produk.', 'error');
    } finally {
      setIsSubmittingRestock(false);
    }
  };

  // Submit Stok Out (Koreksi Pengurangan Stok)
  const handleStockOutSubmit = async (e) => {
    e.preventDefault();
    const qtyNum = parseInt(stockOutData.qty);

    if (!qtyNum || qtyNum <= 0) {
      showAlert('Peringatan', 'Jumlah pengurangan stok harus lebih besar dari 0', 'warning');
      return;
    }

    if (qtyNum > stockOutProduct.stock) {
      showAlert('Gagal', `Pengurangan melebihi stok saat ini (${stockOutProduct.stock} unit).`, 'error');
      return;
    }

    setIsSubmittingStockOut(true);

    try {
      const defaultNote = `Salah Input / Koreksi Stok ${stockOutProduct.name}`;
      const finalNotes = stockOutData.notes.trim() !== '' ? stockOutData.notes.trim() : defaultNote;

      const payload = {
        notes: finalNotes,
        items: [
          {
            product_id: stockOutProduct.id,
            qty: -Math.abs(qtyNum),
            cost_price: parseFloat(stockOutProduct.cost_price || 0),
          }
        ]
      };

      await api.post('/stock-ins', payload);
      showToast(`Stok ${stockOutProduct.name} berhasil dikurangi!`, 'success');
      handleCloseStockOutModal();
      fetchData();
    } catch (err) {
      showAlert('Gagal Koreksi Stok', err.response?.data?.message || 'Gagal mengurangi stok produk.', 'error');
    } finally {
      setIsSubmittingStockOut(false);
    }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await showConfirm(
      'Hapus Produk?',
      `Apakah Anda yakin ingin menghapus produk "${name}"?`,
      'Ya, Hapus',
      'Batal'
    );

    if (isConfirmed) {
      try {
        await api.delete(`/products/${id}`);
        showToast('Produk berhasil dihapus', 'success');
        fetchData();
      } catch (err) {
        showAlert('Gagal Hapus', err.response?.data?.message || 'Gagal menghapus produk.', 'error');
      }
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = selectedCategory === '' || p.category_id === parseInt(selectedCategory);
    return matchSearch && matchCategory;
  });

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(number || 0);
  };

  return (
    <div style={styles.container}>
      {/* HEADER PAGE RESPONSIF */}
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
          <h1 style={styles.title}>Manajemen Produk</h1>
          <p style={styles.subtitle}>Kelola daftar barang, harga modal/jual, dan stok toko Anda.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={fetchData} style={styles.btnSecondary} title="Refresh Data">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => handleOpenModal()} style={styles.btnPrimary}>
            <Plus size={18} /> Tambah Produk
          </button>
        </div>
      </div>

      {/* FILTER & PENCARIAN */}
      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Cari nama produk / kode SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={styles.selectInput}
        >
          <option value="">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* TABEL DATA PRODUK */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.loadingText}>Memuat data produk...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={styles.emptyText}>
            <Package size={48} color="#cbd5e1" />
            <p>Tidak ada produk yang ditemukan.</p>
          </div>
        ) : (
          /* CONTAINER SCROLL KETIKA DATA > 10 */
          <div style={styles.tableScrollContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, textAlign: 'center' }}>No</th>
                  <th style={styles.th}>Kode / SKU</th>
                  <th style={styles.th}>Nama Produk</th>
                  <th style={styles.th}>Kategori</th>
                  <th style={styles.th}>Harga Beli (Modal)</th>
                  <th style={styles.th}>Harga Jual</th>
                  <th style={styles.th}>Margin Profit</th>
                  <th style={styles.th}>Stok</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p, idx) => {
                  const categoryObj = categories.find((c) => c.id === p.category_id) || p.category;
                  const isLowStock = p.stock <= 5;
                  const profitMargin = (p.price || 0) - (p.cost_price || 0);

                  return (
                    <tr key={p.id || idx} style={styles.tr}>
                      <td style={{ ...styles.td, textAlign: 'center', color: '#64748b', fontWeight: '500' }}>
                        {idx + 1}
                      </td>
                      <td style={styles.tdCode}>{p.sku || '-'}</td>
                      <td style={styles.tdName}>{p.name}</td>
                      <td style={styles.td}>
                        <span style={styles.categoryBadge}>
                          {categoryObj ? categoryObj.name : 'Umum'}
                        </span>
                      </td>
                      <td style={styles.td}>{formatRupiah(p.cost_price)}</td>
                      <td style={styles.tdPrice}>{formatRupiah(p.price)}</td>
                      <td style={styles.tdMargin}>{formatRupiah(profitMargin)}</td>
                      <td style={styles.td}>
                        <span style={styles.stockBadge(isLowStock)}>
                          {isLowStock && <AlertTriangle size={12} />}
                          {p.stock} unit
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                          <button 
                            onClick={() => handleOpenRestock(p)} 
                            style={styles.actionBtnRestock} 
                            title="Restock (Tambah Stok)"
                          >
                            <ArrowDownToLine size={14} /> Restock
                          </button>
                          <button 
                            onClick={() => handleOpenStockOut(p)} 
                            style={styles.actionBtnStockOut} 
                            title="Stok Out (Koreksi Pengurangan)"
                          >
                            <ArrowUpFromLine size={14} /> Stok Out
                          </button>
                          <button onClick={() => handleOpenModal(p)} style={styles.actionBtnEdit} title="Edit Informasi">
                            <Edit3 size={15} />
                          </button>
                          <button onClick={() => handleDelete(p.id, p.name)} style={styles.actionBtnDelete} title="Hapus">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM TAMBAH / EDIT INFORMASI PRODUK */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>
                {isEditing ? 'Edit Informasi Produk' : 'Tambah Produk Baru'}
              </h3>
              <button onClick={handleCloseModal} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nama Produk *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Indomie Goreng Jumbo"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Kategori *</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  style={styles.input}
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ ...styles.formRow, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Harga Beli (Modal)</label>
                  <input
                    type="number"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    placeholder="0"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Harga Jual *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={handleCloseModal} style={styles.btnSecondary}>
                  Batal
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  <Check size={18} /> {isEditing ? 'Simpan Perubahan' : 'Tambah Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RESTOCK (STOK MASUK) */}
      {showRestockModal && restockProduct && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a' }}>Restock Produk</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  {restockProduct.name} (Stok Saat Ini: <b>{restockProduct.stock}</b>)
                </p>
              </div>
              <button onClick={handleCloseRestockModal} style={styles.closeBtn}><X size={20} /></button>
            </div>

            <form onSubmit={handleRestockSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Jumlah Stok Masuk (Qty) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={restockData.qty}
                  onChange={(e) => setRestockData({ ...restockData, qty: e.target.value })}
                  placeholder="Jumlah penambahan..."
                  style={styles.input}
                  autoFocus
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Harga Beli / Modal Satuan (Terbaru)</label>
                <input
                  type="number"
                  value={restockData.cost_price}
                  onChange={(e) => setRestockData({ ...restockData, cost_price: e.target.value })}
                  placeholder="0"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Catatan (Opsional)</label>
                <input
                  type="text"
                  value={restockData.notes}
                  onChange={(e) => setRestockData({ ...restockData, notes: e.target.value })}
                  placeholder="Contoh: Belanja Supplier A"
                  style={styles.input}
                />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={handleCloseRestockModal} style={styles.btnSecondary}>Batal</button>
                <button type="submit" style={styles.btnSuccess} disabled={isSubmittingRestock}>
                  <Check size={18} /> {isSubmittingRestock ? 'Menyimpan...' : 'Simpan Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL STOK OUT (KOREKSI PENGURANGAN STOK) */}
      {showStockOutModal && stockOutProduct && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, color: '#dc2626' }}>Stok Out / Koreksi Pengurangan</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  {stockOutProduct.name} (Stok Saat Ini: <b>{stockOutProduct.stock}</b>)
                </p>
              </div>
              <button onClick={handleCloseStockOutModal} style={styles.closeBtn}><X size={20} /></button>
            </div>

            <form onSubmit={handleStockOutSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Jumlah Pengurangan (Qty) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={stockOutProduct.stock}
                  value={stockOutData.qty}
                  onChange={(e) => setStockOutData({ ...stockOutData, qty: e.target.value })}
                  placeholder="Masukkan jumlah yang dikurangi..."
                  style={styles.input}
                  autoFocus
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Alasan / Catatan <span style={{ color: '#94a3b8', fontWeight: '400' }}>(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={stockOutData.notes}
                  onChange={(e) => setStockOutData({ ...stockOutData, notes: e.target.value })}
                  placeholder="Default: Salah Input / Koreksi Stok"
                  style={styles.input}
                />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={handleCloseStockOutModal} style={styles.btnSecondary}>
                  Batal
                </button>
                <button type="submit" style={styles.btnDanger} disabled={isSubmittingStockOut}>
                  <Check size={18} /> {isSubmittingStockOut ? 'Menyimpan...' : 'Kurangi Stok'}
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
  btnSuccess: { padding: '10px 16px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  btnDanger: { padding: '10px 16px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  btnSecondary: { padding: '10px 14px', backgroundColor: '#fff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },

  filterBar: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  searchBox: { flex: 1, minWidth: '220px', position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '12px', color: '#64748b' },
  searchInput: { width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box' },
  selectInput: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', outline: 'none' },

  tableCard: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  
  // CONTAINER DENGAN DUKUNGAN SCROLL LOKAL MAKSIMAL 10 BARIS
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
    fontWeight: '600', 
    color: '#475569', 
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 1,
    whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#334155', whiteSpace: 'nowrap' },
  tdCode: { padding: '14px 16px', fontSize: '13px', fontFamily: 'monospace', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap' },
  tdName: { padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap' },
  tdPrice: { padding: '14px 16px', fontSize: '14px', fontWeight: '700', color: '#2563eb', whiteSpace: 'nowrap' },
  tdMargin: { padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#16a34a', whiteSpace: 'nowrap' },

  categoryBadge: { padding: '4px 10px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '12px', fontWeight: '500' },
  stockBadge: (isLow) => ({
    display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
    backgroundColor: isLow ? '#fef2f2' : '#f0fdf4', color: isLow ? '#dc2626' : '#16a34a',
  }),

  actionBtnRestock: { display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  actionBtnStockOut: { display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  actionBtnEdit: { padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#2563eb', cursor: 'pointer' },
  actionBtnDelete: { padding: '6px', borderRadius: '6px', border: '1px solid #fca5a5', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer' },

  loadingText: { textAlign: 'center', padding: '40px', color: '#64748b' },
  emptyText: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', color: '#94a3b8' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', width: '100%', maxWidth: '480px', borderRadius: '12px', padding: '24px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formRow: { display: 'flex', gap: '12px' },
  formGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#334155' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' },
};