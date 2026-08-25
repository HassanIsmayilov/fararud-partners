import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Layout from '../components/Layout';

export default function Dashboard() {
  const { hotel } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRooms()
      .then(res => setRooms(res.rooms))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const minPrice = rooms.length ? Math.min(...rooms.map(r => parseFloat(r.price_per_night))) : 0;
  const availableRooms = rooms.filter(r => r.is_available).length;

  const stats = [
    { label: 'Ümumi Otaq', value: rooms.length, icon: '🛏️', color: 'bg-blue-500/10 text-blue-400' },
    { label: 'Mövcud Otaq', value: availableRooms, icon: '✅', color: 'bg-green-500/10 text-green-400' },
    { label: 'Min. Qiymət', value: rooms.length ? `$${minPrice}` : '-', icon: '💰', color: 'bg-amber-500/10 text-amber-400' },
    { label: 'Profil', value: hotel?.stars ? '⭐'.repeat(hotel.stars) : 'Tamamlayın', icon: '🏨', color: 'bg-purple-500/10 text-purple-400' },
  ];

  return (
    <Layout title="İdarə Paneli">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xl mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-slate-800">{loading ? '...' : stat.value}</div>
            <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Sürətli Əməliyyatlar</h2>
          <div className="space-y-3">
            <Link to="/profile" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-amber-50 hover:text-amber-700 transition-colors text-sm font-medium text-slate-700">
              <span className="text-lg">🏨</span> Otel Profilini Düzənlə
            </Link>
            <Link to="/rooms/new" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-amber-50 hover:text-amber-700 transition-colors text-sm font-medium text-slate-700">
              <span className="text-lg">➕</span> Yeni Otaq Əlavə Et
            </Link>
            <Link to="/rooms" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-amber-50 hover:text-amber-700 transition-colors text-sm font-medium text-slate-700">
              <span className="text-lg">🛏️</span> Otaqları İdarə Et
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Son Otaqlar</h2>
          {loading ? (
            <div className="text-slate-400 text-sm">Yüklənir...</div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-400 text-sm mb-3">Hələ otaq əlavə edilməyib</p>
              <Link to="/rooms/new" className="text-amber-500 hover:text-amber-400 text-sm font-medium">
                + İlk otağı əlavə edin
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.slice(0, 4).map(room => (
                <div key={room.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-slate-700">{room.name}</div>
                    <div className="text-xs text-slate-400">{room.type} · {room.capacity} nəfər</div>
                  </div>
                  <div className="text-sm font-semibold text-amber-600">${room.price_per_night}/gecə</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
