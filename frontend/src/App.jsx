import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import HotelProfile from './pages/HotelProfile';
import Rooms from './pages/Rooms';
import RoomForm from './pages/RoomForm';

function PrivateRoute({ children }) {
  const { hotel, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-400 text-sm">Yüklənir...</p>
      </div>
    </div>
  );
  return hotel ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { hotel, loading } = useAuth();
  if (loading) return null;
  return hotel ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><HotelProfile /></PrivateRoute>} />
          <Route path="/rooms" element={<PrivateRoute><Rooms /></PrivateRoute>} />
          <Route path="/rooms/new" element={<PrivateRoute><RoomForm /></PrivateRoute>} />
          <Route path="/rooms/edit/:id" element={<PrivateRoute><RoomForm /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
