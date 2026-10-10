import React from 'react';
import { X, Calendar, User, CreditCard, Printer } from 'lucide-react';

export default function TransactionDetailModal({ transaction, onClose, onPrint }) {
  if (!transaction) return null;

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

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header Modal */}
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>Detail Transaksi</h3>
            <span style={styles.invoiceNo}>
              Invoice: #{transaction.invoice_number || transaction.id}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Tombol Cetak dari Modal */}
            <button onClick={() => onPrint(transaction)} style={styles.printBtnModal}>
              <Printer size={16} /> Cetak Struk
            </button>
            <button onClick={onClose} style={styles.closeBtn}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Informasi Ringkas */}
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <Calendar size={16} color="#64748b" />
            <div>
              <div style={styles.infoLabel}>Tanggal</div>
              <div style={styles.infoVal}>{formatDate(transaction.created_at)}</div>
            </div>
          </div>
          <div style={styles.infoItem}>
            <User size={16} color="#64748b" />
            <div>
              <div style={styles.infoLabel}>Kasir</div>
              <div style={styles.infoVal}>{transaction.user?.name || 'Kasir System'}</div>
            </div>
          </div>
          <div style={styles.infoItem}>
            <CreditCard size={16} color="#64748b" />
            <div>
              <div style={styles.infoLabel}>Metode Bayar</div>
              <div style={{ ...styles.infoVal, textTransform: 'uppercase' }}>
                {transaction.payment_method || 'CASH'}
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Item Produk */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Produk</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Qty</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Harga</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(transaction.details || transaction.items || []).map((item, idx) => (
                <tr key={idx} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '600' }}>{item.product?.name || item.name}</div>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>{item.quantity || item.qty}</td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>{formatRupiah(item.price)}</td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: '600' }}>
                    {formatRupiah((item.quantity || item.qty) * item.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rincian Total & Pembayaran */}
        <div style={styles.footerSummary}>
          <div style={styles.sumRow}>
            <span>Total Belanja:</span>
            <span style={styles.sumVal}>{formatRupiah(transaction.total_amount)}</span>
          </div>
          <div style={styles.sumRow}>
            <span>Uang Diterima:</span>
            <span>{formatRupiah(transaction.paid_amount)}</span>
          </div>
          <div style={{ ...styles.sumRow, fontWeight: '700', color: '#16a34a' }}>
            <span>Kembalian:</span>
            <span>{formatRupiah(transaction.change_amount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#ffffff', width: '100%', maxWidth: '580px', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' },
  title: { margin: 0, fontSize: '18px', color: '#0f172a' },
  invoiceNo: { fontSize: '12px', color: '#64748b', fontWeight: '500' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
  printBtnModal: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px' },
  infoItem: { display: 'flex', alignItems: 'center', gap: '8px' },
  infoLabel: { fontSize: '11px', color: '#64748b' },
  infoVal: { fontSize: '13px', fontWeight: '600', color: '#1e293b' },
  tableContainer: { maxHeight: '200px', overflowY: 'auto', marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  thRow: { backgroundColor: '#f1f5f9' },
  th: { padding: '8px 12px', textAlign: 'left', fontSize: '12px', color: '#475569', fontWeight: '600' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '8px 12px', color: '#334155' },
  footerSummary: { backgroundColor: '#eff6ff', padding: '12px 16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' },
  sumRow: { display: 'flex', justifyContent: 'space-between', color: '#1e293b' },
  sumVal: { fontWeight: '700', color: '#2563eb' },
};