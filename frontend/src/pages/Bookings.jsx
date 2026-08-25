import { useState, useEffect } from 'react';
import { api } from '../services/api';
import Layout from '../components/Layout';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchBookings = () => {
    setLoading(true);
    api.getBookings()
      .then(res => setBookings(res.bookings || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setUpdating(id);
    try {
      const res = await api.updateBookingStatus(id, newStatus);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: res.booking.status } : b));
    } catch (err) {
      alert('Status dəyişdirilərkən xəta: ' + err.message);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = bookings.filter(b => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600">✅ Təsdiqləndi</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-600">❌ İmtina Edildi</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-600">🏁 Tamamlandı</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-600 animate-pulse">⏳ Gözləmədə</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('az-AZ', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const calculateNights = (checkIn, checkOut) => {
    const diff = new Date(checkOut) - new Date(checkIn);
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  };

  return (
    <Layout title="📋 Rezervasiya Sorğuları">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Hamısı' },
            { key: 'pending', label: '⏳ Gözləmədə' },
            { key: 'confirmed', label: '✅ Təsdiqlənənlər' },
            { key: 'rejected', label: '❌ İmtina Edilənlər' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                filter === tab.key
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {tab.label} ({bookings.filter(b => tab.key === 'all' ? true : b.status === tab.key).length})
            </button>
          ))}
        </div>

        <button
          onClick={fetchBookings}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3 py-2 rounded-xl"
        >
          🔄 Yenilə
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Yüklənir...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-5xl mb-3">📭</div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Rezervasiya Tapılmadı</h3>
          <p className="text-slate-400 text-xs sm:text-sm">Seçilmiş filtrə uyğun rezervasiya sorğusu yoxdur.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(b => {
            const nights = calculateNights(b.check_in, b.check_out);
            const isUpdating = updating === b.id;

            return (
              <div
                key={b.id}
                className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${
                  b.status === 'pending' ? 'border-amber-400/60 shadow-amber-500/5 ring-2 ring-amber-400/20' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-sm">
                      {b.booking_code.slice(-3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-base">{b.guest_name}</span>
                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                          {b.booking_code}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Sorğu tarixi: {formatDate(b.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(b.status)}
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">${b.total_price} {b.currency}</div>
                      <div className="text-[11px] text-slate-400">{nights} gecə üçün ümumi</div>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 text-xs sm:text-sm">
                  <div className="space-y-1">
                    <div className="text-slate-400 text-xs uppercase font-bold tracking-wider">Otaq</div>
                    <div className="font-semibold text-slate-800">{b.room_name || 'Standart Otaq'}</div>
                    <div className="text-slate-500 text-xs">{b.rooms_count} Otaq · {b.adults} Böyük {b.children > 0 ? `· ${b.children} Uşaq` : ''}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-slate-400 text-xs uppercase font-bold tracking-wider">Tarixlər</div>
                    <div className="font-semibold text-slate-800">
                      📅 {formatDate(b.check_in)} ➔ {formatDate(b.check_out)}
                    </div>
                    <div className="text-slate-500 text-xs">{nights} Gecə Qonaqlama</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-slate-400 text-xs uppercase font-bold tracking-wider">Əlaqə</div>
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      <span>📞 {b.guest_phone}</span>
                      <a
                        href={`https://wa.me/${b.guest_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Salam ${b.guest_name}, "${b.booking_code}" kodlu rezervasiyanız haqqında yazırıq.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 text-xs underline font-bold"
                      >
                        WhatsApp
                      </a>
                    </div>
                    {b.guest_email && <div className="text-slate-500 text-xs">✉️ {b.guest_email}</div>}
                  </div>
                </div>

                {/* Special Requests */}
                {b.special_requests && (
                  <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                    <span className="font-bold text-slate-700">Qonağın Qeydi: </span>
                    {b.special_requests}
                  </div>
                )}

                {/* Action Buttons for Hotel */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  {b.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(b.id, 'rejected')}
                        disabled={isUpdating}
                        className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        ❌ İmtina Et
                      </button>
                      <button
                        onClick={() => handleStatusChange(b.id, 'confirmed')}
                        disabled={isUpdating}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                      >
                        ✅ Rezervasiyanı Təsdiqlə
                      </button>
                    </>
                  )}

                  {b.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange(b.id, 'completed')}
                      disabled={isUpdating}
                      className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      🏁 Qonaqlama Tamamlandı
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
