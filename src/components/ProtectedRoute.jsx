import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, token, loading } = useContext(AuthContext);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  // 1. Jika belum login, redirect ke /login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Jika ada pembatasan role & role user tidak cocok, redirect ke /pos
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/pos" replace />;
  }

  // 3. Render komponen anak di dalam Route
  return <Outlet />;
}