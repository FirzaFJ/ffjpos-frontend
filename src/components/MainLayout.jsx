import { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { 
  ShoppingCart, History, Package, FolderTree, 
  Users, LogOut, Store, ShieldCheck, User, LayoutDashboard,
  Menu, X, TrendingUp, ArrowDownToLine,
  Settings
} from 'lucide-react';
import { showConfirm, showToast } from '../utils/sweetalert';

export default function MainLayout() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // State untuk toggle sidebar di mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State Identitas Toko (Logo & Nama Toko)
  const [storeSettings, setStoreSettings] = useState(null);

  // Load Setting Toko dari Database
  useEffect(() => {
    fetchStoreSettings();
  }, []);

  const fetchStoreSettings = async () => {
    try {
      const res = await api.get('/settings');
      setStoreSettings(res.data?.data || null);
    } catch (err) {
      console.error('Gagal memuat setting toko:', err);
    }
  };

  // Format URL Logo
  const backendBaseUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:8000';

  const logoUrl = storeSettings?.store_logo 
    ? `${backendBaseUrl}/storage/${storeSettings.store_logo}`
    : null;

  const storeName = storeSettings?.store_name || 'POS System';
  const storeTagline = storeSettings?.store_tagline || 'Kasir & Inventaris';

  // Otomatis tutup sidebar mobile saat berpindah halaman
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    const isConfirmed = await showConfirm(
      'Konfirmasi Logout',
      'Apakah Anda yakin ingin keluar dari sistem?',
      'Ya, Logout',
      'Batal'
    );

    if (isConfirmed) {
      try {
        await api.post('/logout');
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        logout();
        showToast('Berhasil keluar dari sistem', 'success');
        navigate('/login');
      }
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div style={styles.layoutWrapper}>
      {/* HEADER MOBILE */}
      <header style={styles.mobileHeader} className="mobile-header">
        <div style={{ display: 'flex', border: 'none', alignItems: 'center', gap: '10px' }}>
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Logo Toko" 
              style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '6px' }} 
            />
          ) : (
            <Store size={22} color="#2563eb" />
          )}
          <span style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>{storeName}</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          style={styles.hamburgerBtn}
          aria-label="Toggle Navigation"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* OVERLAY DARK BACKGROUND */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          style={styles.overlay} 
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside 
        style={{
          ...styles.sidebar,
          transform: isSidebarOpen ? 'translateX(0)' : undefined,
        }}
        className={`sidebar-nav ${isSidebarOpen ? 'open' : ''}`}
      >
        {/* BRANDING HEADER (DENGAN LOGO DINAMIS) */}
        <div style={styles.brand}>
          <div style={styles.brandIcon}>
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo Toko" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} 
              />
            ) : (
              <Store size={22} color="#fff" />
            )}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <h3 style={styles.brandTitle}>{storeName}</h3>
            <span style={styles.brandSubtitle}>{storeTagline}</span>
          </div>
        </div>

        {/* USER PROFILE INFO */}
        <div style={styles.userCard}>
          <div style={styles.userAvatar}>
            {isAdmin ? <ShieldCheck size={20} color="#2563eb" /> : <User size={20} color="#059669" />}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={styles.userName}>{user?.name || 'Pengguna'}</p>
            <span style={styles.roleBadge(isAdmin)}>
              {isAdmin ? 'Administrator' : 'Kasir'}
            </span>
          </div>
        </div>

        {/* NAVIGATION MENU */}
        <nav style={styles.navGroup}>
          <span style={styles.navSectionTitle}>MENU UTAMA</span>

          <NavLink to="/pos" style={({ isActive }) => styles.navItem(isActive)}>
            <ShoppingCart size={18} />
            <span>Transaksi</span>
          </NavLink>

          <NavLink to="/transactions" style={({ isActive }) => styles.navItem(isActive)}>
            <History size={18} />
            <span>Riwayat Transaksi</span>
          </NavLink>

          {/* Akses KHUSUS Admin */}
          {isAdmin && (
            <>
              <span style={{ ...styles.navSectionTitle, marginTop: '16px' }}>MANAJEMEN TOKO</span>

              <NavLink to="/dashboard" style={({ isActive }) => styles.navItem(isActive)}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>

              <NavLink to="/categories" style={({ isActive }) => styles.navItem(isActive)}>
                <FolderTree size={18} />
                <span>Kategori Produk</span>
              </NavLink>

              <NavLink to="/products" style={({ isActive }) => styles.navItem(isActive)}>
                <Package size={18} />
                <span>Data Produk</span>
              </NavLink>

              <NavLink to="/stock-ins" style={({ isActive }) => styles.navItem(isActive)}>
                <ArrowDownToLine size={18} />
                <span>Riwayat Restock & Stock Out</span>
              </NavLink>

              <span style={{ ...styles.navSectionTitle, marginTop: '16px' }}>LAPORAN & PENGGUNA</span>

              <NavLink to="/reports/profit-loss" style={({ isActive }) => styles.navItem(isActive)}>
                <TrendingUp size={18} />
                <span>Laba / Rugi</span>
              </NavLink>

              <NavLink to="/users" style={({ isActive }) => styles.navItem(isActive)}>
                <Users size={18} />
                <span>Kelola Pengguna</span>
              </NavLink>
              
              <NavLink to="/settings" style={({ isActive }) => styles.navItem(isActive)}>
                <Settings size={18} />
                <span>Pengaturan</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* TOMBOL LOGOUT */}
        <div style={styles.footer}>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* AREA KONTEN UTAMA */}
      <main style={styles.mainContent} className="main-layout-content">
        <Outlet />
      </main>

      {/* CSS RESPONSIVE INJECTOR */}
      <style>{`
        @media (max-width: 768px) {
          header.mobile-header {
            display: flex !important;
          }
          aside.sidebar-nav {
            transform: translateX(-100%);
          }
          aside.sidebar-nav.open {
            transform: translateX(0);
          }
          
          main.main-layout-content {
            margin-left: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: calc(100vh - 56px) !important;
            overflow-y: auto !important;
          }

          .pos-container {
            flex-direction: column !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }

          .pos-container > div:first-child {
            overflow-y: visible !important;
            height: auto !important;
          }

          .pos-cart {
            width: 100% !important;
            height: auto !important;
            border-left: none !important;
            border-top: 2px solid #e2e8f0 !important;
            position: relative !important;
          }

          .pos-cart > div:nth-child(2) {
            max-height: 300px !important;
            overflow-y: auto !important;
          }
        }
      `}</style>
    </div>
  );
}

// Inline Styling
const styles = {
  layoutWrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
  },
  mobileHeader: {
    display: 'none',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 90,
    height: '56px',
    boxSizing: 'border-box',
  },
  hamburgerBtn: {
    background: 'none',
    border: 'none',
    color: '#0f172a',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99,
  },
  sidebar: {
    width: '250px',
    height: '100vh',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 100,
    boxSizing: 'border-box',
    padding: '20px 16px',
    transition: 'transform 0.3s ease-in-out',
  },

  mainContent: {
    marginLeft: '250px',
    width: 'calc(100% - 250px)',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    boxSizing: 'border-box',
    overflowY: 'auto',
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #1e293b',
  },
  brandIcon: {
    width: '38px',
    height: '38px',
    backgroundColor: '#2563eb',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  brandTitle: { margin: 0, fontSize: '15px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  brandSubtitle: { 
    fontSize: '11px', 
    color: '#94a3b8', 
    overflow: 'hidden', 
    textOverflow: 'ellipsis', 
    display: 'block', 
    wordBreak: 'break-word', // Memastikan teks panjang terbungkus rapi ke bawah
    overflow: 'visible'
  },
  
  // brandSubtitle: { 
  //   fontSize: '11px', 
  //   color: '#94a3b8', 
  //   display: 'block',
  //   wordBreak: 'break-word', // Memastikan teks panjang terbungkus rapi ke bawah
  //   overflow: 'visible'      // Memastikan tidak ada bagian teks yang disembunyikan
  // },

  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#1e293b',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    backgroundColor: '#334155',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userName: { margin: 0, fontSize: '13px', fontWeight: '600', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  roleBadge: (isAdmin) => ({
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: '700',
    color: isAdmin ? '#60a5fa' : '#34d399',
    textTransform: 'uppercase',
  }),

  navGroup: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' },
  navSectionTitle: { fontSize: '10px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', marginBottom: '6px' },
  navItem: (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: isActive ? '600' : '500',
    color: isActive ? '#ffffff' : '#94a3b8',
    backgroundColor: isActive ? '#2563eb' : 'transparent',
    textDecoration: 'none',
    transition: 'all 0.2s',
  }),

  footer: { paddingTop: '16px', borderTop: '1px solid #1e293b' },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};