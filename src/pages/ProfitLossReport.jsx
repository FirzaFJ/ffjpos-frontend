import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import html2pdf from 'html2pdf.js';
import { 
  DollarSign, TrendingUp, ShoppingBag, 
  RefreshCw, Calendar, Download, Award, ArrowUpRight, Globe
} from 'lucide-react';

const getJakartaDateString = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
};

export default function ProfitLossReport() {
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef(null);
  
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

  const now = new Date();
  const todayStr = getJakartaDateString(now);
  const firstDayStr = getJakartaDateString(new Date(now.getFullYear(), now.getMonth(), 1));

  // State Input Form Tanggal
  const [startDate, setStartDate] = useState(firstDayStr);
  const [endDate, setEndDate] = useState(todayStr);

  // State Tanggal Terpakai di API
  const [appliedStartDate, setAppliedStartDate] = useState(firstDayStr);
  const [appliedEndDate, setAppliedEndDate] = useState(todayStr);

  const [reportData, setReportData] = useState({
    summary: {
      total_revenue: 0,
      total_cogs: 0,
      net_profit: 0,
      profit_margin: 0,
      total_items_sold: 0,
    },
    top_products: []
  });

  // 1. DENGAN MEMASUKKAN DEPENDENCIES, EFFEKTIF DIPANGGIL ULANG SAAT FILTER BERUBAH
  useEffect(() => {
    fetchReport(appliedStartDate, appliedEndDate);
  }, [appliedStartDate, appliedEndDate]);

  // Fungsi Fetch Laporan dari Backend
  const fetchReport = async (startVal = appliedStartDate, endVal = appliedEndDate) => {
    setLoading(true);
    try {
      let url = `/reports/profit-loss`;
      const params = [];

      if (startVal) params.push(`start_date=${startVal}`);
      if (endVal) params.push(`end_date=${endVal}`);

      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const res = await api.get(url);
      if (res.data && res.data.data) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('Gagal mengambil laporan laba rugi:', err);
      const errorMessage = err.response?.data?.message || 'Terjadi kesalahan pada server.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Submit Filter Tanggal Manual
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  };

  // 2. FUNGSI HAPUS FILTER TANGGAL SECARA LENGKAP
  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setAppliedStartDate('');
    setAppliedEndDate('');
  };

  // Fungsi khusus untuk Ekspor ke PDF
  const handleDownloadPDF = () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);

    const element = reportRef.current;
    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     `Laporan_Laba_Rugi_${appliedStartDate || 'Semua'}_s.d_${appliedEndDate || 'Semua'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        setIsExporting(false);
      })
      .catch((err) => {
        console.error('Gagal mengunduh PDF:', err);
        setIsExporting(false);
        alert('Gagal membuat PDF. Silakan coba lagi.');
      });
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(number || 0);
  };

  const { summary, top_products } = reportData;

  // Cek apakah ada filter tanggal yang sedang aktif
  const isFiltered = Boolean(appliedStartDate || appliedEndDate);

  return (
    <div style={styles.container}>
      {/* HEADER PAGE (RESPONSIF) */}
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
          <h1 style={styles.title}>Laporan Keuntungan Bersih</h1>
          <p style={styles.subtitle}>Ringkasan pendapatan, HPP (modal), dan net profit bisnis Anda.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            onClick={handleDownloadPDF} 
            disabled={isExporting || loading} 
            style={styles.exportPdfBtn} 
            title="Cetak Ke PDF"
          >
            <Download size={16} /> {isExporting ? 'Memproses PDF...' : 'Cetak PDF'}
          </button>
          <button onClick={() => fetchReport(appliedStartDate, appliedEndDate)} style={styles.btnPrimary} title="Refresh Data">
            <RefreshCw size={16} /> Perbarui
          </button>
        </div>
      </div>

      {/* FILTER TANGGAL & TOMBOL LIHAT SEMUA LAPORAN */}
      <div style={styles.filterCard}>
        <form onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: '600', fontSize: '14px' }}>
            <Calendar size={18} /> Periode Laporan:
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={styles.dateInput}
          />
          <span style={{ color: '#94a3b8' }}>s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={styles.dateInput}
          />
          <button type="submit" style={styles.btnFilter}>
            Tampilkan Laporan
          </button>
        </form>

        {/* TOMBOL "LIHAT SEMUA LAPORAN" (Hanya Muncul Jika Sedang Ada Filter) */}
        {isFiltered && (
          <button 
            type="button" 
            onClick={handleClearFilter} 
            style={styles.btnAllReport}
            title="Hapus filter tanggal & tampilkan seluruh laporan"
          >
            <Globe size={15} /> Lihat Semua Laporan
          </button>
        )}
      </div>

      {/* AREA LAPORAN YANG AKAN DICETAK KE PDF */}
      <div ref={reportRef} style={styles.pdfArea}>
        {/* Header Khusus dalam PDF */}
        <div style={styles.pdfHeader}>
          <h2>LAPORAN LABA RUGI / KEUNTUNGAN BERSIH</h2>
          <p>
            Periode: {appliedStartDate && appliedEndDate 
              ? `${appliedStartDate} s/d ${appliedEndDate}` 
              : 'Semua Waktu (Keseluruhan)'}
          </p>
          <hr style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '12px 0 20px 0' }} />
        </div>

        {/* RINGKASAN KPI / KARTU KEUANGAN */}
        <div style={styles.metricsGrid}>
          <div style={styles.metricCard}>
            <div style={{ ...styles.iconBox, backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <div style={styles.metricLabel}>Total Omset (Penjualan Kotor)</div>
              <div style={styles.metricValue}>{formatRupiah(summary.total_revenue)}</div>
              <div style={styles.metricSub}>Pendapatan kotor dari transaksi</div>
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={{ ...styles.iconBox, backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <ShoppingBag size={24} />
            </div>
            <div>
              <div style={styles.metricLabel}>Total Modal / HPP (COGS)</div>
              <div style={{ ...styles.metricValue, color: '#dc2626' }}>
                {formatRupiah(summary.total_cogs)}
              </div>
              <div style={styles.metricSub}>Biaya modal barang terjual</div>
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={{ ...styles.iconBox, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div style={styles.metricLabel}>Keuntungan Bersih (Net Profit)</div>
              <div style={{ ...styles.metricValue, color: '#16a34a' }}>
                {formatRupiah(summary.net_profit)}
              </div>
              <div style={styles.metricSub}>Omset dikurangi Total Modal</div>
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={{ ...styles.iconBox, backgroundColor: '#fef3c7', color: '#d97706' }}>
              <ArrowUpRight size={24} />
            </div>
            <div>
              <div style={styles.metricLabel}>Margin Profit (%)</div>
              <div style={{ ...styles.metricValue, color: '#d97706' }}>
                {summary.profit_margin}%
              </div>
              <div style={styles.metricSub}>Persentase keuntungan dari omset</div>
            </div>
          </div>
        </div>

        {/* TABEL TOP PRODUK BERDASARKAN PROFIT */}
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>
              <Award size={18} color="#2563eb" /> Top 5 Produk Paling Menguntungkan
            </h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Total Barang Terjual: <b>{summary.total_items_sold} unit</b>
            </span>
          </div>

          {loading ? (
            <div style={styles.loadingText}>Memuat data laporan...</div>
          ) : top_products.length === 0 ? (
            <div style={styles.emptyText}>Tidak ada data penjualan pada periode ini.</div>
          ) : (
            <div style={styles.tableScrollContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Nama Produk</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Qty Terjual</th>
                    <th style={styles.th}>Total Omset</th>
                    <th style={styles.th}>Total Modal (HPP)</th>
                    <th style={styles.th}>Keuntungan Bersih</th>
                  </tr>
                </thead>
                <tbody>
                  {top_products.map((item, idx) => (
                    <tr key={idx} style={styles.tr}>
                      <td style={styles.tdName}>{item.product?.name || 'Produk Dihapus'}</td>
                      <td style={{ ...styles.td, textAlign: 'center', fontWeight: '600' }}>
                        {item.total_qty} unit
                      </td>
                      <td style={styles.td}>{formatRupiah(item.total_revenue)}</td>
                      <td style={{ ...styles.td, color: '#dc2626' }}>
                        {formatRupiah(item.total_cogs)}
                      </td>
                      <td style={styles.tdProfit}>
                        {formatRupiah(item.total_profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    fontFamily: 'Inter, system-ui, sans-serif',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    marginBottom: '20px',
  },
  title: { margin: 0, fontSize: '24px', fontWeight: '700', color: '#0f172a' },
  subtitle: { margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' },

  exportPdfBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },

  btnPrimary: {
    padding: '10px 16px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },

  filterCard: {
    backgroundColor: '#ffffff',
    padding: '16px 20px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  dateInput: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    color: '#0f172a',
    outline: 'none',
  },
  btnFilter: {
    padding: '8px 16px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  btnAllReport: {
    padding: '8px 14px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },

  pdfArea: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
  },
  pdfHeader: {
    marginBottom: '10px',
  },

  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  metricCard: {
    backgroundColor: '#ffffff',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  iconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metricLabel: { fontSize: '12px', color: '#64748b', marginBottom: '2px' },
  metricValue: { fontSize: '18px', fontWeight: '700', color: '#0f172a' },
  metricSub: { fontSize: '11px', color: '#94a3b8', marginTop: '2px' },

  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  tableHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tableTitle: { margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' },
  tableScrollContainer: {
    maxHeight: '550px',
    overflowY: 'auto',
    overflowX: 'auto',
  },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: {
    backgroundColor: '#f8fafc',
    padding: '10px 16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 1,
    whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', fontSize: '13px', color: '#334155', whiteSpace: 'nowrap' },
  tdName: { padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap' },
  tdProfit: { padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#16a34a', whiteSpace: 'nowrap' },

  loadingText: { textAlign: 'center', padding: '40px', color: '#64748b' },
  emptyText: { textAlign: 'center', padding: '40px', color: '#94a3b8' },
};