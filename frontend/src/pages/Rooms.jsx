import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, BACKEND_URL } from '../services/api';
import Layout from '../components/Layout';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState(null);

  const getImg = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${BACKEND_URL}${url}`;
  };

  const fetchRooms = () => {
    setLoading(true);
    api.getRooms()
      .then(res => setRooms(res.rooms))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" otağını silmək istəyirsiniz?`)) return;
    setDeleting(id);
    try {
      await api.deleteRoom(id);
      setRooms(prev => prev.filter(r => r.id !== id));
      setMessage({ type: 'success', text: 'Otaq silindi.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleAvailable = async (room) => {
    try {
      const res = await api.updateRoom(room.id, { is_available: !room.is_available });
      setRooms(prev => prev.map(r => r.id === room.id ? res.room : r));
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const TYPE_LABELS = {
    standard: 'Standart', deluxe: 'Deluxe', suite: 'Süit',
    family: 'Ailə', single: 'Tək', double: 'Cüt', twin: 'İki Ayrı', penthouse: 'Penthouse',
  };

  return (
    <Layout title="🛏️ Otaqların İdarəsi">
      <div className="flex items-center justify-between mb-6">
        <p className="text-slate-500 text-sm">{rooms.length} otaq tapıldı</p>
        <Link
          to="/rooms/new"
          className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          + Yeni Otaq
        </Link>
      </div>

      {message && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">Yüklənir...</div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="text-5xl mb-4">🛏️</div>
          <p className="text-slate-500 mb-4">Hələ heç bir otaq əlavə edilməyib</p>
          <Link to="/rooms/new" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
            İlk otağı əlavə edin
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {rooms.map(room => (
            <div key={room.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-5">
              {/* Image or placeholder */}
              <div className="w-20 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                {room.images?.length > 0
                  ? <img src={getImg(room.images[0])} alt="" className="w-full h-full object-cover" />
                  : '🛏️'
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-800">{room.name}</span>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    {TYPE_LABELS[room.type] || room.type}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${room.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {room.is_available ? 'Mövcuddur' : 'Mövcud deyil'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-3">
                  <span>👥 {room.capacity} nəfər</span>
                  {room.bed_type && <span>🛏️ {room.bed_type}</span>}
                  {room.size_sqm && <span>📐 {room.size_sqm} m²</span>}
                  <span>📦 {room.total_rooms} otaq mövcuddur</span>
                </div>
              </div>

              {/* Price */}
              <div className="text-right flex-shrink-0">
                <div className="text-xl font-bold text-amber-600">${room.price_per_night}</div>
                <div className="text-xs text-slate-400">gecəlik</div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggleAvailable(room)}
                  title={room.is_available ? 'Mövcud deyil et' : 'Mövcud et'}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm transition-colors"
                >
                  {room.is_available ? '🔒' : '🔓'}
                </button>
                <Link
                  to={`/rooms/edit/${room.id}`}
                  className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm transition-colors"
                >
                  ✏️
                </Link>
                <button
                  onClick={() => handleDelete(room.id, room.name)}
                  disabled={deleting === room.id}
                  className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm transition-colors disabled:opacity-50"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
