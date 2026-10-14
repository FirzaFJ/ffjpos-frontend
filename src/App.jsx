import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import MainLayout from './components/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import PosKasir from './pages/PosKasir.jsx';
import TransactionHistory from './pages/TransactionHistory.jsx';
import Products from './pages/Products.jsx';
import Categories from './pages/Categories.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Users from './pages/Users.jsx';
import Login from './pages/Login.jsx';
import Settings from './pages/settings.jsx';

import ProfitLossReport from './pages/ProfitLossReport.jsx';
import StockInHistory from './pages/StockInHistory.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Route Publik */}
          <Route path="/login" element={<Login />} />

          {/* Group Route Terproteksi */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<Navigate to="/pos" replace />} />

              {/* Akses Admin & Cashier */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'cashier']} />}>
                <Route path="pos" element={<PosKasir />} />
                <Route path="transactions" element={<TransactionHistory />} />
              </Route>

              {/* Akses Khusus Admin */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="categories" element={<Categories />} />
                <Route path="products" element={<Products />} />
                <Route path="stock-ins" element={<StockInHistory />} />
                <Route path="reports/profit-loss" element={<ProfitLossReport />} />
                <Route path="users" element={<Users />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/pos" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}