import Swal from 'sweetalert2';

// 1. Notifikasi Toast (Melayang di Pojok Kanan Atas)
export const showToast = (title, icon = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

  Toast.fire({
    icon: icon, // 'success' | 'error' | 'warning' | 'info'
    title: title,
  });
};

// 2. Alert Modal Pesan (Sukses / Error / Warning)
export const showAlert = (title, text = '', icon = 'info') => {
  return Swal.fire({
    title: title,
    text: text,
    icon: icon,
    confirmButtonColor: '#2563eb',
    confirmButtonText: 'OK',
  });
};

// 3. Dialog Konfirmasi (Misal: Hapus / Batal Transaksi)
export const showConfirm = async (
  title = 'Apakah Anda yakin?',
  text = 'Tindakan ini tidak dapat dibatalkan!',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal'
) => {
  const result = await Swal.fire({
    title: title,
    text: text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626', // Warna merah untuk aksi sensitif
    cancelButtonColor: '#64748b',  // Warna abu-abu
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });

  return result.isConfirmed;
};