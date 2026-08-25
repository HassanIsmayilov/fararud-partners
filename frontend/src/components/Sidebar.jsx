import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: '📊 Göstərici', icon: '📊' },
  { to: '/profile', label: '🏨 Otel Profili' },
  { to: '/rooms', label: '🛏️ Otaqlar' },
];

export default function Sidebar() {
  const { hotel, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 font-bold text-lg">
            F
          </div>
          <div>
            <div className="font-bold text-sm text-white">Ferarun</div>
            <div className="text-xs text-amber-400">Partner Portal</div>
          </div>
        </div>
      </div>

      {/* Hotel info */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center text-amber-400 font-bold">
            {hotel?.name?.[0]?.toUpperCase() || 'H'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{hotel?.name || 'Otel'}</div>
            <div className="text-xs text-slate-400 truncate">{hotel?.city || 'Şəhər'}</div>
          </div>
        </div>
        {!hotel?.is_approved && (
          <div className="mt-2 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded px-2 py-1">
            ⏳ Admin təsdiqi gözlənilir
          </div>
        )}
        {hotel?.is_approved && (
          <div className="mt-2 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded px-2 py-1">
            ✅ Təsdiqlənib
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-900'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          🚪 Çıxış
        </button>
      </div>
    </aside>
  );
}
