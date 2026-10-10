import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import TransactionDetailModal from '../components/TransactionDetailModal';
import ThermalReceipt from '../components/ThermalReceipt';
import '../components/receipt.css';
import { showToast, showAlert, showConfirm } from '../utils/sweetalert';

// Impor Library untuk Export File
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { 
  TrendingUp, ShoppingBag, DollarSign, Calendar, 
  Search, RefreshCw, RotateCcw, Trash2, FileSpreadsheet, FileText, ListFilter 
} from 'lucide-react';

export default function TransactionHistory() {
  // Fungsi Helper untuk format YYYY-MM-DD
  const getFirstDayOfMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  };

  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Input Filter Tanggal & Search
  const [startDateInput, setStartDateInput] = useState(getFirstDayOfMonth());
  const [endDateInput, setEndDateInput] = useState(getTodayDate());
  const [searchInput, setSearchInput] = useState('');

  // State Filter Aktif
  const [appliedFilter, setAppliedFilter] = useState({
    startDate: getFirstDayOfMonth(),
    endDate: getTodayDate(),
  });

  // State Identitas Toko untuk Struk
  const [storeSettings, setStoreSettings] = useState(null);
  const [printTx, setPrintTx] = useState(null);
  const receiptRef = useRef();

  useEffect(() => {
    fetchStoreSettings();
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions');
      let rawData = [];
      if (Array.isArray(res.data)) {
        rawData = res.data;
      } else if (Array.isArray(res.data?.data)) {
        rawData = res.data.data;
      } else if (Array.isArray(res.data?.data?.data)) {
        rawData = res.data.data.data;
      }
      setTransactions(rawData);
    } catch (err) {
      console.error('Gagal memuat transaksi:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreSettings = async () => {
    // Cek apakah data settings sudah ada di localStorage agar tidak request ke server
    const cachedSettings = localStorage.getItem('store_settings');
    if (cachedSettings) {
      setStoreSettings(JSON.parse(cachedSettings));
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/settings');
      const data = res.data?.data || null;
      setStoreSettings(data);
      
      // Simpan ke localStorage
      localStorage.setItem('store_settings', JSON.stringify(data));
    } catch (err) {
      console.error('Gagal memuat pengaturan:', err);
    } finally {
      setLoading(false);
    }
  };

  // Terapkan Filter Tanggal saat tombol "Tampilkan" diklik
  const handleApplyDateFilter = () => {
    setAppliedFilter({
      startDate: startDateInput,
      endDate: endDateInput,
    });
  };

  // FUNGSI BARU: RESET TANGGAL UNTUK TAMPILKAN SEMUA TRANSAKSI
  const handleShowAllTransactions = () => {
    setStartDateInput('');
    setEndDateInput('');
    setAppliedFilter({
      startDate: '',
      endDate: '',
    });
  };

  const handlePrintTransaction = (tx) => {
    setPrintTx(tx);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Filter Data Transaksi secara REAL-TIME
  const filteredTransactions = Array.isArray(transactions)
    ? transactions.filter((tx) => {
        // 1. Filter Pencarian Real-Time
        const query = searchInput.trim().toLowerCase();
        const matchSearch =
          !query ||
          (tx.invoice_number && tx.invoice_number.toLowerCase().includes(query)) ||
          (tx.id && tx.id.toString().includes(query)) ||
          (tx.user?.name && tx.user.name.toLowerCase().includes(query));

        if (!matchSearch) return false;

        // 2. Filter Tanggal
        if (!tx.created_at) return true;

        const txDateObj = new Date(
          typeof tx.created_at === 'string' 
            ? tx.created_at.replace(' ', 'T') 
            : tx.created_at
        );

        if (appliedFilter.startDate) {
          const start = new Date(appliedFilter.startDate);
          start.setHours(0, 0, 0, 0);
          if (txDateObj < start) return false;
        }

        if (appliedFilter.endDate) {
          const end = new Date(appliedFilter.endDate);
          end.setHours(23, 59, 59, 999);
          if (txDateObj > end) return false;
        }

        return true;
      })
    : [];

  const activeTransactions = filteredTransactions.filter((tx) => tx.status !== 'cancelled');
  const totalOmset = activeTransactions.reduce((sum, tx) => sum + parseFloat(tx.total_amount || 0), 0);
  const totalTransactions = activeTransactions.length;
  const avgTransaction = totalTransactions > 0 ? totalOmset / totalTransactions : 0;

  const [selectedTx, setSelectedTx] = useState(null);

  const formatRupiah = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const isoDate = typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr;
    return new Date(isoDate).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Export Excel & PDF
  const exportToExcel = async () => {
    if (filteredTransactions.length === 0) {
      alert('Tidak ada data transaksi untuk diexport.');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Transaksi');

    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'LAPORAN PENJUALAN & TRANSAKSI POS';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 32;

    worksheet.mergeCells('A2:I2');
    const subTitleCell = worksheet.getCell('A2');
    const periodText = `Periode: ${appliedFilter.startDate || 'Awal'} s/d ${appliedFilter.endDate || 'Sekarang'}`;
    subTitleCell.value = `Tanggal Cetak: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} | ${periodText}`;
    subTitleCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF475569' } };
    subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 18;

    worksheet.addRow([]);

    const headers = [
      'No',
      'No. Invoice',
      'Tanggal & Waktu',
      'Kasir',
      'Metode Bayar',
      'Status',
      'Total Belanja',
      'Uang Diterima',
      'Kembalian',
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.height = 24;

    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } },
      };
    });

    filteredTransactions.forEach((tx, index) => {
      const isCancelled = tx.status === 'cancelled';
      const row = worksheet.addRow([
        index + 1,
        tx.invoice_number || `#${tx.id}`,
        formatDate(tx.created_at),
        tx.user?.name || 'Kasir System',
        (tx.payment_method || 'CASH').toUpperCase(),
        isCancelled ? 'Dibatalkan' : 'Selesai',
        parseFloat(tx.total_amount || 0),
        parseFloat(tx.paid_amount || 0),
        parseFloat(tx.change_amount || 0),
      ]);

      row.height = 20;

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 9.5 };
        cell.alignment = { vertical: 'middle' };

        if (index % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }

        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        if ([1, 5, 6].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }

        if ([7, 8, 9].includes(colNumber)) {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        }

        if (colNumber === 6 && isCancelled) {
          cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFDC2626' } };
        }
      });
    });

    const totalRowNumber = filteredTransactions.length + 5;
    worksheet.mergeCells(`A${totalRowNumber}:F${totalRowNumber}`);

    const totalLabelCell = worksheet.getCell(`A${totalRowNumber}`);
    totalLabelCell.value = 'TOTAL OMSET PENJUALAN (SELESAI)';
    totalLabelCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    totalLabelCell.alignment = { vertical: 'middle', horizontal: 'right' };

    const totalCell = worksheet.getCell(`G${totalRowNumber}`);
    totalCell.value = { formula: `SUMIF(F5:F${totalRowNumber - 1}, "Selesai", G5:G${totalRowNumber - 1})` };
    totalCell.numFmt = '"Rp "#,##0';
    totalCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF16A34A' } };

    const summaryRow = worksheet.getRow(totalRowNumber);
    summaryRow.height = 24;
    summaryRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      };
    });

    const customWidths = [6, 18, 20, 16, 16, 12, 16, 16, 14];
    worksheet.columns.forEach((col, idx) => {
      col.width = customWidths[idx] || 15;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = `Laporan_Penjualan_POS_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, filename);
  };

  const exportToPDF = () => {
    if (filteredTransactions.length === 0) {
      alert('Tidak ada data transaksi untuk diexport.');
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Laporan Penjualan & Transaksi POS', 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Dicetak Pada: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`, 14, 22);
    doc.text(`Periode Filter: ${appliedFilter.startDate || 'Awal'} s/d ${appliedFilter.endDate || 'Sekarang'}`, 14, 27);
    doc.text(`Total Omset Aktif: ${formatRupiah(totalOmset)} | Total Transaksi Selesai: ${totalTransactions}`, 14, 34);

    const tableHeaders = [['No', 'Invoice', 'Tanggal', 'Kasir', 'Metode', 'Status', 'Total Bayar']];
    const tableData = filteredTransactions.map((tx, index) => [
      index + 1,
      tx.invoice_number || `#${tx.id}`,
      formatDate(tx.created_at),
      tx.user?.name || 'Kasir',
      (tx.payment_method || 'CASH').toUpperCase(),
      tx.status === 'cancelled' ? 'Dibatalkan' : 'Selesai',
      formatRupiah(tx.total_amount),
    ]);

    autoTable(doc, {
      startY: 40,
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 8 },
    });

    const filename = `Laporan_Transaksi_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  const parseTxData = (tx) => {
    if (typeof tx === 'object' && tx !== null) {
      return { id: tx.id, invoiceNum: tx.invoice_number || `INV-${tx.id}` };
    }
    const found = transactions.find((t) => t.id === Number(tx));
    return { id: tx, invoiceNum: found?.invoice_number || `INV-${tx}` };
  };

  const handleCancelTransaction = async (tx) => {
    const { id: txId, invoiceNum } = parseTxData(tx);
    const isConfirmed = await showConfirm(
      'Batalkan Transaksi?',
      `Apakah Anda yakin ingin membatalkan transaksi ${invoiceNum}?\nStok barang akan otomatis dikembalikan.`,
      'Ya, Batalkan',
      'Kembali'
    );

    if (!isConfirmed) return;

    try {
      await api.post(`/transactions/${txId}/cancel`);
      showToast('Transaksi berhasil dibatalkan!', 'success');
      fetchTransactions();
      if (selectedTx?.id === txId) setSelectedTx(null);
    } catch (err) {
      console.error('Gagal membatalkan transaksi:', err);
      showAlert('Gagal Batal', err.response?.data?.message || 'Gagal membatalkan transaksi.', 'error');
    }
  };

  const handleRestoreTransaction = async (tx) => {
    const { id: txId, invoiceNum } = parseTxData(tx);
    const isConfirmed = await showConfirm(
      'Pulihkan Transaksi?',
      `Apakah Anda yakin ingin memulihkan transaksi ${invoiceNum}?\nStok barang akan otomatis dipotong kembali.`,
      'Ya, Pulihkan',
      'Batal'
    );

    if (!isConfirmed) return;

    try {
      await api.post(`/transactions/${txId}/restore`);
      showToast('Transaksi berhasil dipulihkan!', 'success');
      fetchTransactions();
      if (selectedTx?.id === txId) setSelectedTx(null);
    } catch (err) {
      console.error('Gagal memulihkan transaksi:', err);
      showAlert('Gagal Pulihkan', err.response?.data?.message || 'Gagal memulihkan transaksi.', 'error');
    }
  };

  const handleDeleteTransaction = async (tx) => {
    const { id: txId, invoiceNum } = parseTxData(tx);
    const isConfirmed = await showConfirm(
      'Hapus Permanen?',
      `PERINGATAN: Apakah Anda yakin ingin MENGHAPUS PERMANEN transaksi ${invoiceNum}?\nData yang dihapus tidak dapat dikembalikan!`,
      'Ya, Hapus Permanen',
      'Batal'
    );

    if (!isConfirmed) return;

    try {
      await api.delete(`/transactions/${txId}`);
      showToast('Transaksi berhasil dihapus permanen!', 'success');
      fetchTransactions();
      if (selectedTx?.id === txId) setSelectedTx(null);
    } catch (err) {
      console.error('Gagal menghapus transaksi:', err);
      showAlert('Gagal Hapus', err.response?.data?.message || 'Gagal menghapus transaksi.', 'error');
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @media (max-width: 768px) {
          .tx-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .tx-btn-group {
            width: 100% !important;
            justify-content: flex-start !important;
            flex-wrap: wrap !important;
          }
          .tx-btn-group button {
            flex: 1 !important;
            justify-content: center !important;
          }
          .tx-filter-card {
            flex-direction: column !important;
            align-items: stretch !important;
          }
        }
      `}</style>

      {/* 1. AREA STRUK CETAK (Wajib print-only) */}
      <div className="print-only">
        <ThermalReceipt ref={receiptRef} transaction={printTx} storeSettings={storeSettings} />
      </div>

      {/* 2. SELURUH HALAMAN UTAMA (Bungkus dengan class 'no-print' agar otomatis tersembunyi saat cetak) */}
      <div className="no-print">
        {/* Header Halaman & Tombol Export */}
        <div className="tx-header" style={styles.header}>
          <div>
            <h1 style={styles.title}>Riwayat & Ringkasan Transaksi</h1>
            <p style={styles.subtitle}>Kelola, cetak ulang, dan unduh laporan transaksi penjualan toko</p>
          </div>
          
          <div className="tx-btn-group" style={styles.btnGroup}>
            <button onClick={exportToExcel} style={styles.exportExcelBtn} title="Export ke Excel">
              <FileSpreadsheet size={16} /> Excel
            </button>
            <button onClick={exportToPDF} style={styles.exportPdfBtn} title="Export ke PDF">
              <FileText size={16} /> PDF
            </button>
            <button onClick={fetchTransactions} style={styles.refreshBtn} title="Refresh Data">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={styles.metricsGrid}>
          <div style={styles.metricCard}>
            <div style={{ ...styles.iconBox, backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <div style={styles.metricLabel}>Total Omset</div>
              <div style={styles.metricValue}>{formatRupiah(totalOmset)}</div>
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={{ ...styles.iconBox, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <ShoppingBag size={24} />
            </div>
            <div>
              <div style={styles.metricLabel}>Jumlah Transaksi Aktif</div>
              <div style={styles.metricValue}>{totalTransactions} Transaksi</div>
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={{ ...styles.iconBox, backgroundColor: '#fef3c7', color: '#d97706' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div style={styles.metricLabel}>Rata-Rata Transaksi</div>
              <div style={styles.metricValue}>{formatRupiah(avgTransaction)}</div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="tx-filter-card" style={styles.filterCard}>
          <div style={styles.filterLeftGroup}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: '600', fontSize: '14px' }}>
              <Calendar size={18} color="#475569" />
              <span>Periode:</span>
            </div>

            <input
              type="date"
              value={startDateInput}
              onChange={(e) => setStartDateInput(e.target.value)}
              style={styles.dateInputBox}
            />

            <span style={{ color: '#94a3b8', fontSize: '13px' }}>s/d</span>

            <input
              type="date"
              value={endDateInput}
              onChange={(e) => setEndDateInput(e.target.value)}
              style={styles.dateInputBox}
            />

            <button onClick={handleApplyDateFilter} style={styles.submitFilterBtn}>
              Tampilkan
            </button>

            {(appliedFilter.startDate || appliedFilter.endDate) && (
              <button onClick={handleShowAllTransactions} style={styles.allFilterBtn} title="Lihat Seluruh Riwayat Transaksi">
                <ListFilter size={14} /> 1500 Transaksi Terakhir
              </button>
            )}
          </div>

          <div style={styles.searchBox}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Cari No. Invoice / ID / Kasir..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Tabel Transaksi */}
        <div style={styles.tableCard}>
          {loading ? (
            <div style={styles.centerMsg}>Memuat riwayat transaksi...</div>
          ) : filteredTransactions.length === 0 ? (
            <div style={styles.centerMsg}>Tidak ada transaksi ditemukan pada periode ini.</div>
          ) : (
            <div style={styles.tableScrollContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={{ ...styles.th, textAlign: 'center', width: '50px' }}>No</th>
                    <th style={styles.th}>Invoice / ID</th>
                    <th style={styles.th}>Tanggal</th>
                    <th style={styles.th}>Metode</th>
                    <th style={styles.th}>Status</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Total Bayar</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx, index) => (
                    <tr key={tx.id} style={styles.tr}>
                      <td style={{ ...styles.td, textAlign: 'center', fontWeight: '600', color: '#64748b' }}>
                        {index + 1}
                      </td>
                      <td style={{ ...styles.td, fontWeight: '600', color: '#2563eb', whiteSpace: 'nowrap' }}>
                        #{tx.invoice_number || tx.id}
                      </td>
                      <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>{formatDate(tx.created_at)}</td>
                      
                      <td style={{ ...styles.td, textTransform: 'uppercase', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {tx.payment_method || 'CASH'}
                      </td>

                      <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: tx.status === 'cancelled' ? '#fef2f2' : '#f0fdf4',
                            color: tx.status === 'cancelled' ? '#ef4444' : '#16a34a',
                          }}
                        >
                          {tx.status === 'cancelled' ? 'Dibatalkan' : 'Selesai'}
                        </span>
                      </td>

                      <td style={{ ...styles.td, textAlign: 'right', fontWeight: '700', whiteSpace: 'nowrap' }}>
                        {formatRupiah(tx.total_amount)}
                      </td>

                      <td style={{ ...styles.td, textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          <button onClick={() => setSelectedTx(tx)} style={styles.detailBtn}>
                            Detail
                          </button>
                          <button onClick={() => handlePrintTransaction(tx)} style={styles.printBtnTable}>
                            Cetak
                          </button>
                          
                          {tx.status === 'cancelled' ? (
                            <>
                              <button onClick={() => handleRestoreTransaction(tx.id)} style={styles.restoreBtnTable} title="Pulihkan Transaksi">
                                <RotateCcw size={13} /> Pulihkan
                              </button>
                              <button onClick={() => handleDeleteTransaction(tx.id)} style={styles.deleteBtnTable} title="Hapus Permanen">
                                <Trash2 size={13} /> Hapus
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handleCancelTransaction(tx.id)} style={styles.cancelBtnTable}>
                              Batal
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedTx && (
          <TransactionDetailModal
            transaction={selectedTx}
            onClose={() => setSelectedTx(null)}
            onPrint={handlePrintTransaction}
          />
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { margin: 0, fontSize: '22px', color: '#0f172a' },
  subtitle: { margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' },
  btnGroup: { display: 'flex', gap: '8px' },
  refreshBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#334155' },
  exportExcelBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  exportPdfBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' },
  metricCard: { backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' },
  iconBox: { width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  metricLabel: { fontSize: '12px', color: '#64748b', marginBottom: '2px' },
  metricValue: { fontSize: '18px', fontWeight: '700', color: '#0f172a' },
  
  filterCard: { backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' },
  filterLeftGroup: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  dateInputBox: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#1e293b', backgroundColor: '#ffffff' },
  submitFilterBtn: { padding: '8px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#ffffff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  
  // Style Tombol Baru "Semua Transaksi"
  allFilterBtn: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px', 
    padding: '8px 14px', 
    borderRadius: '8px', 
    border: '1px solid', 
    backgroundColor: '#eff6ff', 
    color: '#2563eb', 
    fontSize: '13px', 
    fontWeight: '600', 
    cursor: 'pointer' 
  },

  searchBox: { position: 'relative', display: 'flex', alignItems: 'center', minWidth: '240px' },
  searchIcon: { position: 'absolute', left: '12px', color: '#94a3b8' },
  searchInput: { width: '100%', padding: '9px 12px 9px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' },

  tableCard: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableScrollContainer: { maxHeight: '520px', overflowY: 'auto', overflowX: 'auto', width: '100%' },
  table: { width: '100%', minWidth: '700px', borderCollapse: 'collapse', fontSize: '14px' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#475569', fontWeight: '600', backgroundColor: '#f8fafc' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', color: '#334155' },
  detailBtn: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #2563eb', backgroundColor: '#eff6ff', color: '#2563eb', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  printBtnTable: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #16a34a', backgroundColor: '#f0fdf4', color: '#16a34a', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  cancelBtnTable: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ef4444', backgroundColor: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  restoreBtnTable: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #059669', backgroundColor: '#ecfdf5', color: '#059669', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  deleteBtnTable: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #dc2626', backgroundColor: '#991b1b', color: '#ffffff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  centerMsg: { padding: '40px', textAlign: 'center', color: '#64748b' },
};