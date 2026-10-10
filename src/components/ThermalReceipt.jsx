import React, { forwardRef } from 'react';

const ThermalReceipt = forwardRef(({ transaction, storeSettings }, ref) => {
  if (!transaction) return null;

  const storeName = storeSettings?.store_name || 'FFJ TOKO';
  const storeTagline = storeSettings?.store_tagline || '';
  const storeAddress = storeSettings?.store_address || 'Jl. Pemuda no 110';
  const storePhone = storeSettings?.store_phone || '081712693621';
  const receiptFooter = storeSettings?.receipt_footer_text || 'Barang yang sudah dibeli tidak bisa dikembalikan';

  const backendBaseUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:8000';

  const logoUrl = storeSettings?.store_logo 
    ? `${backendBaseUrl}/storage/${storeSettings.store_logo}`
    : null;

  const formatRupiah = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);

  return (
    <div ref={ref} className="thermal-receipt">
      {/* Header Toko Dinamis */}
      <div className="receipt-header">
        {logoUrl && (
          <div className="logo-container">
            <img src={logoUrl} alt="Logo Toko" className="receipt-logo" />
          </div>
        )}
        <h2 className="store-name">{storeName}</h2>
        {storeTagline && <p className="store-tagline">{storeTagline}</p>}
        <p className="store-address">{storeAddress}</p>
        {storePhone && <p className="store-telp">Telp: {storePhone}</p>}
      </div>

      <div className="divider">--------------------------------</div>

      {/* Info Transaksi */}
      <div className="receipt-info">
        <div>No: {transaction.invoice_number || transaction.id}</div>
        <div>Tgl: {new Date(transaction.created_at || Date.now()).toLocaleString('id-ID')}</div>
        <div>Kasir: {transaction.user?.name || 'Kasir Non-Aktif'}</div>
      </div>

      <div className="divider">--------------------------------</div>

      {/* Item Belanjaan */}
      <div className="receipt-items">
        {(transaction.details || transaction.items || []).map((item, index) => (
          <div key={index} className="item-row">
            <div className="item-name">{item.product?.name || item.name}</div>
            <div className="item-calc">
              <span>
                {item.quantity || item.qty} x {formatRupiah(item.price)}
              </span>
              <span>{formatRupiah((item.quantity || item.qty) * item.price)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="divider">--------------------------------</div>

      {/* Ringkasan Pembayaran */}
      <div className="receipt-summary">
        <div className="summary-row">
          <span>Total:</span>
          <span>{formatRupiah(transaction.total_amount || transaction.total_price)}</span>
        </div>
        <div className="summary-row">
          <span>Bayar ({transaction.payment_method || 'CASH'}):</span>
          <span>{formatRupiah(transaction.paid_amount || transaction.pay_amount || transaction.total_price)}</span>
        </div>
        <div className="summary-row font-bold">
          <span>Kembali:</span>
          <span>{formatRupiah(transaction.change_amount || transaction.change || 0)}</span>
        </div>
      </div>

      <div className="divider">--------------------------------</div>

      {/* Footer Dinamis */}
      <div className="receipt-footer">
        <p className="font-bold" style={{ margin: '0 0 4px 0' }}>*** TERIMA KASIH ***</p>
        <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{receiptFooter}</p>
      </div>
    </div>
  );
});

export default ThermalReceipt;