import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  DollarSign, ShoppingBag, TrendingUp, RefreshCw, PackageCheck, CreditCard,
  AlertTriangle, ArrowUpRight, ArrowDownRight, CalendarDays
} from 'lucide-react';

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');

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

  // Setiap kali 'period' berubah, fetchStats akan dipanggil otomatis
  useEffect(() => {
    fetchStats(period);
  }, [period]);

  const fetchStats = async (selectedPeriod = period) => {
    setLoading(true);
    try {
        // Parameter period dikirim ke API backend untuk memfilter seluruh data (termasuk top products)
        const res = await api.get(`/dashboard-stats?period=${selectedPeriod}&t=${Date.now()}`);
        setStats(null); 
        setTimeout(() => {
          setStats(res.data.data);
        }, 50);
    } catch (err) {
        console.error('Gagal mengambil data dashboard:', err);
    } finally {
        setLoading(false);
    }
  };

  const formatRupiah = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);

  if (loading && !stats) {
    return <div style={styles.centerMsg}>Memuat statistik dashboard...</div>;
  }

  const growth = stats?.growth_percentage || 0;
  const isPositiveGrowth = growth >= 0;

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
          <h1 style={styles.title}>Dashboard Analytics Penjualan</h1>
          <p style={styles.subtitle}>Ringkasan performa dan tren bisnis POS Anda</p>
        </div>
        
        <button 
          onClick={() => fetchStats(period)} 
          style={styles.refreshBtn} 
          title="Refresh Data"
          disabled={loading}
        >
          <RefreshCw size={16} /> {loading ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      {/* Metrics Cards (4 Kartu) */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={{ ...styles.iconBox, backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <CalendarDays size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={styles.metricLabel}>Omset Hari Ini</div>
            <div style={styles.metricValue}>{formatRupiah(stats?.today_omset)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '12px' }}>
              <span style={{ 
                color: isPositiveGrowth ? '#16a34a' : '#dc2626',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center' 
              }}>
                {isPositiveGrowth ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(growth)}%
              </span>
              <span style={{ color: '#94a3b8' }}>vs kemarin ({formatRupiah(stats?.yesterday_omset)})</span>
            </div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={{ ...styles.iconBox, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={styles.metricLabel}>Total Omset</div>
            <div style={styles.metricValue}>{formatRupiah(stats?.total_omset)}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Akumulasi Penjualan
            </div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={{ ...styles.iconBox, backgroundColor: '#fef3c7', color: '#d97706' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <div style={styles.metricLabel}>Total Transaksi</div>
            <div style={styles.metricValue}>{stats?.total_transactions || 0} Selesai</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Hari Ini: {stats?.today_count || 0} Transaksi
            </div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={{ ...styles.iconBox, backgroundColor: '#fef2f2', color: '#dc2626' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={styles.metricLabel}>Stok Menipis (≤5)</div>
            <div style={{ ...styles.metricValue, color: (stats?.low_stock_products?.length || 0) > 0 ? '#dc2626' : '#16a34a' }}>
              {stats?.low_stock_products?.length || 0} Produk
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Perlu segera di-restock
            </div>
          </div>
        </div>
      </div>

      {/* Grid Grafik */}
      <div 
        style={{
          ...styles.chartsGrid,
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        }}
      >
        {/* Grafik 1: Tren Penjualan dengan Filter Periode */}
        <div 
          style={{
            ...styles.chartCard,
            gridColumn: isMobile ? 'span 1' : 'span 2',
          }}
        >
          <div 
            style={{
              ...styles.chartHeader,
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? '12px' : '0',
            }}
          >
            <h3 style={styles.chartTitle}>
              <TrendingUp size={18} color="#2563eb" /> Tren Omset Penjualan
            </h3>
            
            <div style={styles.periodTabGroup}>
              {[
                { key: 'daily', label: '7 Hari' },
                { key: 'monthly', label: 'Bulanan' },
                { key: 'yearly', label: 'Tahunan' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setPeriod(item.key)}
                  style={{
                    ...styles.periodBtn,
                    backgroundColor: period === item.key ? '#2563eb' : '#f1f5f9',
                    color: period === item.key ? '#ffffff' : '#64748b',
                    fontWeight: period === item.key ? '600' : '500',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={stats?.sales_chart || []}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `Rp${val / 1000}k`} />
                <Tooltip formatter={(value) => [formatRupiah(value), 'Omset']} />
                <Area type="monotone" dataKey="total" stroke="#2563eb" fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CARD DOKUMEN / DAFTAR STOK MENIPIS */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>
            <AlertTriangle size={18} color="#dc2626" /> Peringatan Stok Menipis
          </h3>
          {stats?.low_stock_products?.length === 0 ? (
            <div style={styles.emptyStockMsg}>Semua stok produk masih aman 👍</div>
          ) : (
            <div style={styles.lowStockList}>
              {stats?.low_stock_products?.map((prod) => (
                <div key={prod.id} style={styles.lowStockItem}>
                  <div>
                    <div style={styles.prodName}>{prod.name}</div>
                    <div style={styles.prodPrice}>{formatRupiah(prod.price)}</div>
                  </div>
                  <span style={styles.stockBadge(prod.stock)}>
                    Sisa: {prod.stock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grafik 2: Top 5 Produk Terlaris (Qty) - Otomatis terfilter berdasarkan state 'period' */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>
              <PackageCheck size={18} color="#16a34a" /> Top 5 Produk Terlaris ({period === 'daily' ? '7 Hari' : period === 'monthly' ? 'Bulan Ini' : 'Tahun Ini'})
            </h3>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={stats?.top_products || []} layout="vertical" key={period}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="name" type="category" width={90} stroke="#64748b" fontSize={11} />
                <Tooltip formatter={(value) => [`${value} unit`, 'Terjual']} />
                <Bar dataKey="qty" fill="#16a34a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik 3: Distribusi Metode Pembayaran */}
        <div 
          style={{
            ...styles.chartCard,
            gridColumn: isMobile ? 'span 1' : 'span 2',
          }}
        >
          <h3 style={styles.chartTitle}>
            <CreditCard size={18} color="#d97706" /> Distribusi Metode Pembayaran
          </h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                <Pie
                  data={stats?.payment_methods || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={!isMobile}
                  label={
                    isMobile 
                      ? false 
                      : ({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {(stats?.payment_methods || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Transaksi`, 'Jumlah']} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', marginBottom: '24px' },
  title: { margin: 0, fontSize: '22px', fontWeight: '700', color: '#0f172a' },
  subtitle: { margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' },
  refreshBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#334155' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' },
  metricCard: { backgroundColor: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' },
  iconBox: { width: '46px', height: '46px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  metricLabel: { fontSize: '12px', color: '#64748b', marginBottom: '2px' },
  metricValue: { fontSize: '17px', fontWeight: '700', color: '#0f172a' },
  chartsGrid: { display: 'grid', gap: '20px' },
  chartCard: { backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  chartHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '16px' },
  chartTitle: { margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' },
  periodTabGroup: { display: 'flex', gap: '6px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' },
  periodBtn: { border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' },
  lowStockList: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto' },
  lowStockItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' },
  prodName: { fontSize: '13px', fontWeight: '600', color: '#1e293b' },
  prodPrice: { fontSize: '12px', color: '#64748b' },
  stockBadge: (stock) => ({
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '700',
    backgroundColor: stock === 0 ? '#fef2f2' : '#fff7ed',
    color: stock === 0 ? '#dc2626' : '#c2410c',
  }),
  emptyStockMsg: { padding: '40px 0', textAlign: 'center', color: '#16a34a', fontWeight: '600', fontSize: '14px' },
  centerMsg: { padding: '60px', textAlign: 'center', color: '#64748b' },
};