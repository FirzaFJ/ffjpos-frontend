import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import html2pdf from 'html2pdf.js';
import { 
  PackageCheck, RefreshCw, Calendar, Download, 
  Search, ArrowDownRight, Layers, Globe
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

export default function StockInHistory() {
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const [stockIns, setStockIns] = useState([]);
  const [summary, setSummary] = useState({
    total_records: 0,
    total_items_added: 0,
    total_cost: 0,
  });

  useEffect(() => {
    fetchStockInHistory(appliedStartDate, appliedEndDate);
  }, [appliedStartDate, appliedEndDate]);

  const fetchStockInHistory = async (startVal = appliedStartDate, endVal = appliedEndDate) => {
    setLoading(true);
    try {
      const params = {};
      if (startVal) params.start_date = startVal;
      if (endVal) params.end_date = endVal;

      const res = await api.get('/stock-ins', { params });

      let rawList = [];
      const responseData = res.data;

      if (Array.isArray(responseData)) {
        rawList = responseData;
      } else if (Array.isArray(responseData?.data)) {
        rawList = responseData.data;
      } else if (responseData?.data && Array.isArray(responseData.data.data)) {
        rawList = responseData.data.data;
      } else if (responseData?.data && typeof responseData.data === 'object') {
        rawList = Object.values(responseData.data).filter(item => typeof item === 'object');
      } else if (Array.isArray(responseData?.stock_ins)) {
        rawList = responseData.stock_ins;
      }

      let itemsList = [];
      rawList.forEach((row) => {
        if (Array.isArray(row.details) && row.details.length > 0) {
          row.details.forEach((dt) => {
            itemsList.push({
              ...dt,
              reference_number: row.reference_number || dt.reference_number,
              notes: row.notes || row.note || dt.notes,
              created_at: dt.created_at || row.created_at,
            });
          });
        } else if (Array.isArray(row.items) && row.items.length > 0) {
          row.items.forEach((it) => {
            itemsList.push({
              ...it,
              reference_number: row.reference_number || it.reference_number,
              notes: row.notes || row.note || it.notes,
              created_at: it.created_at || row.created_at,
            });
          });
        } else {
          itemsList.push(row);
        }
      });

      setStockIns(itemsList);

      let totalQty = 0;
      let totalCostSum = 0;

      itemsList.forEach((item) => {
        const qty = Number(item.qty ?? item.quantity ?? 1);
        const cost = Number(item.cost_price ?? item.total_cost ?? 0);
        const subtotal = Number(item.subtotal ?? (qty * cost));

        totalQty += qty;
        totalCostSum += subtotal;
      });

      setSummary({
        total_records: itemsList.length,
        total_items_added: totalQty,
        total_cost: totalCostSum,
      });

    } catch (err) {
      console.error('Gagal mengambil data stok masuk:', err);
      alert('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  };

  // FUNGSI HAPUS FILTER & TAMPILKAN SEMUA DATA
  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setAppliedStartDate('');
    setAppliedEndDate('');
  };

  const handleDownloadPDF = () => {
    if (!reportRef.current) return;

    setIsExporting(true);

    const element = reportRef.current;
    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     `Laporan_Stok_Masuk_${appliedStartDate || 'Semua'}_s.d_${appliedEndDate || 'Semua'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => setIsExporting(false))
      .catch((err) => {
        console.error('Gagal membuat PDF:', err);
        setIsExporting(false);
      });
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(number || 0);
  };

  const formatTanggal = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const filteredStockIns = stockIns.filter((item) => {
    const prodName = (item.product?.name || item.product_name || '').toLowerCase();
    const sku = (item.product?.sku || item.sku || '').toLowerCase();
    const refNum = (item.reference_number || '').toLowerCase();
    const notes = (item.notes || item.note || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    return (
      prodName.includes(search) || 
      sku.includes(search) || 
      refNum.includes(search) || 
      notes.includes(search)
    );
  });

  const isFiltered = Boolean(appliedStartDate || appliedEndDate);

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
          <h1 style={styles.title}>Riwayat Restock & Stock Out</h1>
          <p style={styles.subtitle}>Pencatatan penambahan stok barang dan koreksi/stok out.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            onClick={handleDownloadPDF} 
            disabled={isExporting || loading} 
            style={styles.exportPdfBtn} 
          >
            <Download size={16} /> {isExporting ? 'Memproses PDF...' : 'Cetak PDF'}
          </button>
          <button onClick={() => fetchStockInHistory(appliedStartDate, appliedEndDate)} style={styles.btnPrimary}>
            <RefreshCw size={16} /> Perbarui
          </button>
        </div>
      </div>

      {/* FILTER TANGGAL (KIRI) & SEARCH BOX (KANAN) */}
      <div style={{
        ...styles.filterCard,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
      }}>
        {/* BAGIAN KIRI: FILTER TANGGAL */}
        <form onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: '600', fontSize: '14px' }}>
            <Calendar size={18} /> Periode:
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
            Tampilkan
          </button>

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
        </form>

        {/* BAGIAN KANAN: SEARCH BOX */}
        <div style={{
          ...styles.searchBox,
          marginTop: isMobile ? '12px' : 0,
          marginLeft: isMobile ? 0 : 'auto', // Pendorong otomatis ke kanan pada desktop
          width: isMobile ? '100%' : 'auto',
        }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Cari produk / SKU / catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              ...styles.searchInput,
              width: isMobile ? '100%' : '220px',
            }}
          />
        </div>
      </div>

      {/* AREA PRINT PDF */}
      <div ref={reportRef} style={styles.pdfArea}>
        <div style={styles.pdfHeader}>
          <h2>LAPORAN RIWAYAT RESTOK & STOCK OUT</h2>
          <p>
            Periode: {appliedStartDate && appliedEndDate 
              ? `${appliedStartDate} s/d ${appliedEndDate}` 
              : 'Semua Waktu (Keseluruhan)'}
          </p>
          <hr style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '12px 0 20px 0' }} />
        </div>

        {/* METRIK SUMMARY */}
        <div style={styles.metricsGrid}>
          <div style={styles.metricCard}>
            <div style={{ ...styles.iconBox, backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Layers size={22} />
            </div>
            <div>
              <div style={styles.metricLabel}>Total Transaksi / Baris</div>
              <div style={styles.metricValue}>{summary.total_records} Data</div>
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={{ ...styles.iconBox, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <ArrowDownRight size={22} />
            </div>
            <div>
              <div style={styles.metricLabel}>Total Mutasi Stok</div>
              <div style={{ ...styles.metricValue, color: summary.total_items_added >= 0 ? '#16a34a' : '#dc2626' }}>
                {summary.total_items_added > 0 ? `+${summary.total_items_added}` : summary.total_items_added} Unit
              </div>
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={{ ...styles.iconBox, backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <PackageCheck size={22} />
            </div>
            <div>
              <div style={styles.metricLabel}>Total Pembelian Modal</div>
              <div style={{ ...styles.metricValue, color: '#0f172a' }}>
                {formatRupiah(summary.total_cost)}
              </div>
            </div>
          </div>
        </div>

        {/* TABEL DATA STOK MASUK */}
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>
              <PackageCheck size={18} color="#2563eb" /> Rincian Transaksi Stok
            </h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Total Data: <b>{filteredStockIns.length} Baris</b>
            </span>
          </div>

          <div style={isExporting ? {} : styles.tableScrollContainer}>
            {loading ? (
              <div style={styles.loadingText}>Memuat data stok...</div>
            ) : filteredStockIns.length === 0 ? (
              <div style={styles.emptyText}>Tidak ada riwayat stok pada periode ini.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, textAlign: 'center' }}>No</th>
                    <th style={styles.th}>Waktu</th>
                    <th style={styles.th}>No Ref / Produk</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Jumlah</th>
                    <th style={styles.th}>Harga Modal</th>
                    <th style={styles.th}>Subtotal / Total</th>
                    <th style={styles.th}>Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStockIns.map((item, idx) => {
                    const dateVal = item.created_at;
                    const prodName = item.product?.name || item.product_name;
                    const refNum = item.reference_number;
                    const displayName = prodName ? prodName : (refNum ? refNum : `Stock In #${item.id || idx + 1}`);
                    
                    const sku = item.product?.sku || item.sku || '';
                    const qty = Number(item.qty ?? item.quantity ?? 1);
                    const cost = Number(item.cost_price ?? item.total_cost ?? 0);
                    const subtotal = Number(item.subtotal ?? (qty * cost));
                    const notes = item.notes || item.note || '-';

                    const isPositive = qty > 0;
                    const qtyColor = isPositive ? '#16a34a' : '#dc2626';
                    const formattedQty = isPositive ? `+${qty}` : `${qty}`;

                    return (
                      <tr key={item.id || idx} style={styles.tr}>
                        <td style={{ ...styles.td, textAlign: 'center', color: '#64748b', fontWeight: '500' }}>
                          {idx + 1}
                        </td>
                        <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>
                          {formatTanggal(dateVal)}
                        </td>
                        <td style={styles.tdName}>
                          <div>{displayName}</div>
                          {sku && <small style={{ color: '#94a3b8', fontWeight: 'normal' }}>SKU: {sku}</small>}
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center', fontWeight: '700', color: qtyColor }}>
                          {formattedQty}
                        </td>
                        <td style={styles.td}>
                          {formatRupiah(cost)}
                        </td>
                        <td style={{ ...styles.td, fontWeight: '600' }}>
                          {formatRupiah(subtotal)}
                        </td>
                        <td style={styles.td}>
                          {notes}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
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
  exportPdfBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },

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

  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f8fafc',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    boxSizing: 'border-box',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '14px',
    color: '#0f172a',
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
  },
  tableTitle: { margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' },
  
  tableScrollContainer: {
    maxHeight: '550px',
    overflowY: 'auto',
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
  },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', fontSize: '13px', color: '#334155' },
  tdName: { padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#0f172a' },

  loadingText: { textAlign: 'center', padding: '40px', color: '#64748b' },
  emptyText: { textAlign: 'center', padding: '40px', color: '#94a3b8' },
};