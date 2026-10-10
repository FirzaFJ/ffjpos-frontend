import { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

import { 
  Search, ShoppingCart, Trash2, Plus, Minus, 
  CreditCard, CheckCircle2, Store, RefreshCw, X, Printer, User
} from 'lucide-react';

// IMPORT KOMPONEN STRUK & CSS CETAK
import ThermalReceipt from '../components/ThermalReceipt';
import '../components/receipt.css';
import { showAlert, showToast } from '../utils/sweetalert';

export default function PosKasir() {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Modal Checkout & Pembayaran
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [payAmount, setPayAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  
  // State Identitas Toko untuk Struk
  const [storeSettings, setStoreSettings] = useState(null);

  // STATE & REF KHUSUS CETAK STRUK
  const [receiptData, setReceiptData] = useState(null);
  const receiptRef = useRef();

  // Load Identitas Toko
  useEffect(() => {
    fetchStoreSettings();
  }, []);

  const fetchStoreSettings = async () => {
    try {
      const res = await api.get('/settings');
      setStoreSettings(res.data?.data || null);
    } catch (err) {
      console.error('Gagal memuat identitas toko untuk struk:', err);
    }
  };

  // Load Data Produk & Kategori dari Backend
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

  // Filter Produk
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
                        (p.code && p.code.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = selectedCategory === '' || p.category_id === parseInt(selectedCategory);
    return matchSearch && matchCategory;
  });

  // Fungsi Keranjang Belanja
  const addToCart = (product) => {
    if (product.stock <= 0) {
      showAlert('Stok Habis!', `Stok produk "${product.name}" telah habis.`, 'warning');
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          showAlert('Batas Stok Maksimal!', `Jumlah di keranjang melebihi stok yang tersedia (${product.stock}).`, 'warning');
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            if (newQty > item.stock) {
              showAlert('Batas Stok Maksimal!', `Jumlah melebihi stok yang tersedia (${item.stock}).`, 'warning');
              return item;
            }
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  // Perhitungan Subtotal & Kembalian
  const totalSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const changeAmount = payAmount ? parseFloat(payAmount) - totalSubtotal : 0;

  // FUNGSI CETAK STRUK
  const handlePrint = () => {
    window.print();
  };

  // Fungsi Transaksi / Checkout
  const handleProcessTransaction = async (e) => {
    e.preventDefault();

    const numericPaidAmount = parseFloat(payAmount) || 0;

    if (cart.length === 0) {
      showAlert('Keranjang Kosong', 'Keranjang belanjaan masih kosong.', 'info');
      return;
    }

    if (paymentMethod === 'cash' && numericPaidAmount < totalSubtotal) {
      showAlert('Pembayaran Kurang!', 'Uang pembayaran kurang dari total belanjaan.', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      const finalPaidAmount = paymentMethod === 'cash' ? numericPaidAmount : totalSubtotal;

      const payload = {
        items: cart.map((item) => ({
          product_id: parseInt(item.id),
          quantity: parseInt(item.qty),
        })),
        paid_amount: finalPaidAmount,
        payment_method: paymentMethod,
      };

      const res = await api.post('/transactions', payload);
      const rawData = res.data.data || res.data;

      const completeReceiptData = {
        ...rawData,
        user: rawData?.user || user,
      };

      setReceiptData(completeReceiptData);
      setCheckoutSuccess(true);
      fetchData();

      showToast('Transaksi Berhasil Selesai!', 'success');

    } catch (err) {
      console.error('Error Checkout:', err);
      if (err.response && err.response.status === 422) {
        const validationErrors = err.response.data.errors;
        const messages = validationErrors 
          ? Object.values(validationErrors).flat().join('<br/>') 
          : err.response.data.message;
        
        showAlert('Gagal Validasi', messages, 'error');
      } else {
        showAlert('Error', err.response?.data?.message || 'Terjadi kesalahan sistem.', 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const closeCheckoutModal = () => {
    setShowCheckout(false);
    setCheckoutSuccess(false);
    setPaymentMethod('cash');
    setPayAmount('');
    setReceiptData(null);
    clearCart();
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(number || 0);
  };

  return (
    <div className="pos-container" style={styles.container}>
      {/* MEDIA QUERY STYLES UNTUK MOBILE */}
      <style>{`
        @media (max-width: 768px) {
          .pos-container {
            flex-direction: column !important;
            height: auto !important;
            max-height: none !important;
            overflow-y: auto !important;
          }
          .pos-product-section {
            height: auto !important;
            padding: 12px !important;
          }
          .pos-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }
          .pos-filter-bar {
            flex-direction: column !important;
          }
          .pos-category-select {
            width: 100% !important;
          }
          .pos-product-scroll {
            max-height: 400px !important;
          }
          .pos-cart {
            width: 100% !important;
            height: auto !important;
            border-left: none !important;
            border-top: 2px solid #e2e8f0 !important;
          }
          .pos-cart-scroll {
            max-height: 240px !important;
          }
        }
      `}</style>

      {/* THERMAL RECEIPT */}
      <div className="print-only">
        <ThermalReceipt 
          ref={receiptRef} 
          transaction={receiptData} 
          storeSettings={storeSettings} 
        />
      </div>

      {/* AREA KIRI: KATALOG PRODUK */}
      <div style={styles.productSection} className="pos-product-section no-print">
        <div style={styles.header} className="pos-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Store size={26} color="#2563eb" />
            <h1 style={styles.title}>Kasir POS Interaktif</h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.cashierBadge}>
              <User size={16} color="#2563eb" />
              <span>Kasir: <strong>{user?.name || 'Kasir'}</strong></span>
            </div>

            <button onClick={fetchData} style={styles.refreshBtn} title="Refresh Data">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Filter & Pencarian */}
        <div style={styles.filterBar} className="pos-filter-bar">
          <div style={styles.searchBox}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Cari produk / kode barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={styles.categorySelect}
            className="pos-category-select"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* KOTAK SCROLL KATALOG PRODUK */}
        <div style={styles.productScrollBox} className="pos-product-scroll">
          {loading ? (
            <div style={styles.centerMessage}>Memuat katalog produk...</div>
          ) : filteredProducts.length === 0 ? (
            <div style={styles.centerMessage}>Produk tidak ditemukan.</div>
          ) : (
            <div style={styles.productGrid}>
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  style={{
                    ...styles.productCard,
                    opacity: p.stock <= 0 ? 0.6 : 1,
                    cursor: p.stock <= 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div style={styles.stockBadge(p.stock)}>
                    Stok: {p.stock}
                  </div>
                  <h3 style={styles.productName}>{p.name}</h3>
                  <p style={styles.productPrice}>{formatRupiah(p.price)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AREA KANAN: PANEL KERANJANG BELANJA */}
      <div className="pos-cart no-print" style={styles.cartSection}>
        <div style={styles.cartHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart size={22} color="#1e293b" />
            <h2 style={{ margin: 0, fontSize: 18, color: '#1e293b' }}>Keranjang</h2>
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} style={styles.clearCartBtn}>
              <Trash2 size={16} /> Kosongkan
            </button>
          )}
        </div>

        {/* KOTAK SCROLL DAFTAR KERANJANG */}
        <div style={styles.cartScrollBox} className="pos-cart-scroll">
          {cart.length === 0 ? (
            <div style={styles.emptyCart}>
              <ShoppingCart size={48} color="#cbd5e1" />
              <p>Keranjang masih kosong</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} style={styles.cartItem}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.cartItemTitle}>{item.name}</div>
                  <div style={styles.cartItemPrice}>{formatRupiah(item.price)}</div>
                </div>

                <div style={styles.qtyControls}>
                  <button onClick={() => updateQty(item.id, -1)} style={styles.qtyBtn}>
                    <Minus size={14} />
                  </button>
                  <span style={styles.qtyText}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} style={styles.qtyBtn}>
                    <Plus size={14} />
                  </button>
                </div>

                <div style={styles.cartItemTotal}>
                  {formatRupiah(item.price * item.qty)}
                </div>

                <button onClick={() => removeFromCart(item.id)} style={styles.removeBtn}>
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* TOMBOL TRANSAKSI DI BAGIAN BAWAH LAYAR */}
        <div style={styles.cartFooter}>
          <div style={styles.summaryRow}>
            <span>Total Bayar</span>
            <span style={styles.totalPrice}>{formatRupiah(totalSubtotal)}</span>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => setShowCheckout(true)}
            style={{
              ...styles.checkoutBtn,
              opacity: cart.length === 0 ? 0.5 : 1,
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <CreditCard size={18} /> Process Payment
          </button>
        </div>
      </div>

      {/* MODAL CHECKOUT */}
      {showCheckout && (
        <div style={styles.modalOverlay} className="no-print">
          <div style={styles.modalContent}>
            {!checkoutSuccess ? (
              <>
                <div style={styles.modalHeader}>
                  <h3 style={{ margin: 0 }}>Konfirmasi Pembayaran</h3>
                  <button onClick={() => setShowCheckout(false)} style={styles.closeBtn}>
                    <X size={20} />
                  </button>
                </div>

                <div style={styles.modalBody}>
                  <div style={styles.checkoutTotalBox}>
                    <span>Total Tagihan</span>
                    <h2 style={{ margin: '4px 0 0 0' }}>{formatRupiah(totalSubtotal)}</h2>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={styles.label}>Metode Pembayaran</label>
                    <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                      {['cash', 'qris', 'transfer'].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(method);
                            if (method !== 'cash') {
                              setPayAmount(totalSubtotal.toString());
                            }
                          }}
                          style={{
                            ...styles.methodBtn,
                            borderColor: paymentMethod === method ? '#2563eb' : '#cbd5e1',
                            backgroundColor: paymentMethod === method ? '#eff6ff' : '#ffffff',
                            color: paymentMethod === method ? '#2563eb' : '#334155',
                          }}
                        >
                          {method.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentMethod === 'cash' && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={styles.label}>Uang Diterima (Tunai)</label>
                      <input
                        type="number"
                        placeholder="Contoh: 50000"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        style={styles.modalInput}
                        autoFocus
                      />
                      {payAmount && (
                        <div style={{ marginTop: 8, fontSize: 13, color: changeAmount < 0 ? '#dc2626' : '#16a34a' }}>
                          {changeAmount < 0 
                            ? `Kurang: ${formatRupiah(Math.abs(changeAmount))}` 
                            : `Kembalian: ${formatRupiah(changeAmount)}`}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={styles.modalFooter}>
                  <button
                    disabled={isProcessing}
                    onClick={handleProcessTransaction}
                    style={styles.confirmPayBtn}
                  >
                    {isProcessing ? 'Memproses...' : 'Selesaikan Transaksi'}
                  </button>
                </div>
              </>
            ) : (
              <div style={styles.successBox}>
                <CheckCircle2 size={64} color="#16a34a" style={{ margin: '0 auto 12px' }} />
                <h2>Transaksi Berhasil!</h2>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
                  No. Invoice: <strong>{receiptData?.invoice_number || receiptData?.id}</strong>
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={handlePrint} style={styles.printBtn}>
                    <Printer size={18} /> Cetak Struk Nota
                  </button>
                  
                  <button onClick={closeCheckoutModal} style={styles.confirmPayBtn}>
                    Selesai & Transaksi Baru
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Styles
const styles = {
  container: { 
    display: 'flex', 
    height: '100vh', 
    maxHeight: '100vh',
    width: '100%', 
    backgroundColor: '#f8fafc', 
    fontFamily: 'Inter, system-ui, sans-serif', 
    overflow: 'hidden',
    boxSizing: 'border-box'
  },
  
  productSection: { 
    flex: 1, 
    padding: '20px', 
    display: 'flex', 
    flexDirection: 'column', 
    height: '100vh',
    boxSizing: 'border-box',
    overflow: 'hidden'
  },
  
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  title: { margin: 0, fontSize: '20px', color: '#0f172a' },
  
  cashierBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#1e40af',
  },

  refreshBtn: { padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' },
  filterBar: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  searchBox: { flex: 1, minWidth: '200px', position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '12px', color: '#94a3b8' },
  searchInput: { width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' },
  categorySelect: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '14px', outline: 'none' },

  productScrollBox: {
    flex: 1,
    overflowY: 'auto',
    paddingRight: '6px',
  },
  
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' },
  productCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: '12px', 
    padding: '12px 14px', 
    border: '1px solid #e2e8f0', 
    position: 'relative', 
    display: 'flex', 
    flexDirection: 'column', 
    justify: 'space-between',
    minHeight: '135px',
    boxSizing: 'border-box'
  },
  stockBadge: (stock) => ({ alignSelf: 'flex-start', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: stock > 5 ? '#f0fdf4' : '#fef2f2', color: stock > 5 ? '#16a34a' : '#dc2626', fontWeight: '600', marginBottom: '8px' }),
  productName: { 
    margin: '0 0 6px 0', 
    fontSize: '13px', 
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: '1.35',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    wordBreak: 'break-word',
  },
  productPrice: { margin: 0, fontSize: '15px', fontWeight: '700', color: '#2563eb' },
  
  cartSection: { 
    width: '360px', 
    backgroundColor: '#ffffff', 
    borderLeft: '1px solid #e2e8f0', 
    display: 'flex', 
    flexDirection: 'column',
    height: '100vh',
    boxSizing: 'border-box',
    flexShrink: 0
  },
  cartHeader: { padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  clearCartBtn: { background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },
  
  cartScrollBox: { 
    flex: 1,
    overflowY: 'auto',  
    padding: '12px 16px',
    borderBottom: '1px solid #f1f5f9'
  },
  
  emptyCart: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '160px', color: '#94a3b8', gap: '8px' },
  cartItem: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px', 
    paddingBottom: '12px', 
    marginBottom: '12px', 
    borderBottom: '1px solid #f1f5f9' 
  },
  cartItemTitle: { 
    fontSize: '13px', 
    fontWeight: '600', 
    color: '#1e293b', 
    lineHeight: '1.3',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    wordBreak: 'break-word',
    marginBottom: '2px',
  },
  cartItemPrice: { 
    fontSize: '12px', 
    color: '#64748b' 
  },
  qtyControls: { display: 'flex', alignItems: 'center', gap: '4px' },
  qtyBtn: { width: '22px', height: '22px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: '12px', fontWeight: '600', minWidth: '16px', textAlign: 'center' },
  cartItemTotal: { fontSize: '13px', fontWeight: '700', color: '#0f172a' },
  removeBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' },
  
  cartFooter: { 
    padding: '16px 20px', 
    borderTop: '1px solid #e2e8f0', 
    backgroundColor: '#f8fafc',
    marginTop: 'auto'
  },
  summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' },
  totalPrice: { fontSize: '18px', fontWeight: '800', color: '#2563eb' },
  checkoutBtn: { width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' },
  modalContent: { backgroundColor: '#ffffff', width: '100%', maxWidth: '420px', borderRadius: '16px', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', boxSizing: 'border-box' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
  checkoutTotalBox: { backgroundColor: '#eff6ff', padding: '12px', borderRadius: '10px', textAlign: 'center', marginBottom: '16px', color: '#1d4ed8' },
  label: { fontSize: '13px', fontWeight: '600', color: '#334155' },
  methodBtn: { flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid', fontWeight: '600', cursor: 'pointer', fontSize: '12px' },
  modalInput: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '6px', fontSize: '14px', boxSizing: 'border-box' },
  modalFooter: { marginTop: '16px' },
  confirmPayBtn: { width: '100%', padding: '12px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  printBtn: { width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  successBox: { textAlign: 'center', padding: '12px 0' },
  centerMessage: { textAlign: 'center', padding: '40px', color: '#64748b', width: '100%' },
};