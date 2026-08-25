import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, BACKEND_URL } from '../services/api';
import Layout from '../components/Layout';

const AMENITIES_LIST = [
  'WiFi', 'Hovuz', 'Spa', 'Restoran', 'Bar', 'Fitnes Zalı',
  'Parking', 'Hava Limanı Transfer', 'Otaq Xidməti', 'Konfrans Zalı',
  'Uşaq Havuzu', 'Pulsuz Sübh Yemək', 'Lift', '24/7 Resepsion',
];
const CITIES = ['Tehran', 'Bağdad', 'Məşhəd', 'İsfahan', 'Şiraz', 'Kərbəla', 'Nəcəf', 'Basra', 'Ərbil', 'Mosul'];
const COUNTRIES = ['Iran', 'Iraq'];

export default function HotelProfile() {
  const { hotel, refreshHotel } = useAuth();
  const [form, setForm] = useState({
    name: '', phone: '', city: '', country: 'Iran', address: '',
    description: '', stars: '', website: '', amenities: [],
  });
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    if (hotel) {
      setForm({
        name: hotel.name || '',
        phone: hotel.phone || '',
        city: hotel.city || '',
        country: hotel.country || 'Iran',
        address: hotel.address || '',
        description: hotel.description || '',
        stars: hotel.stars || '',
        website: hotel.website || '',
        amenities: hotel.amenities || [],
      });
      setImages(hotel.images || []);
    }
  }, [hotel]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const toggleAmenity = (item) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(item)
        ? prev.amenities.filter(a => a !== item)
        : [...prev.amenities, item],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.updateHotel({ ...form, stars: form.stars ? parseInt(form.stars) : null });
      await refreshHotel();
      setMessage({ type: 'success', text: '✅ Profil uğurla güncəlləndi!' });
    } catch (err) {
      setMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.uploadHotelImage(formData);
      setImages(prev => [...prev, res.url]);
      await refreshHotel();
      setMessage({ type: 'success', text: '✅ Şəkil yükləndi!' });
    } catch (err) {
      setMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (url) => {
    if (!confirm('Bu şəkli silmək istəyirsiniz?')) return;
    try {
      await api.deleteHotelImage(url);
      setImages(prev => prev.filter(img => img !== url));
      await refreshHotel();
    } catch (err) {
      setMessage({ type: 'error', text: `❌ ${err.message}` });
    }
  };

  const inputClass = "w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50";
  const labelClass = "block text-sm font-medium text-slate-600 mb-2";

  return (
    <Layout title="🏨 Otel Profili">
      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        {/* Basic info */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-5">Əsas Məlumatlar</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Otel Adı *</label>
              <input required value={form.name} onChange={set('name')} placeholder="Grand Hotel" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Telefon</label>
              <input value={form.phone} onChange={set('phone')} placeholder="+98 21..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Vebsayt</label>
              <input value={form.website} onChange={set('website')} placeholder="https://hotel.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Ölkə</label>
              <select value={form.country} onChange={set('country')} className={inputClass}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Şəhər</label>
              <select value={form.city} onChange={set('city')} className={inputClass}>
                <option value="">Seçin...</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Ünvan</label>
              <input value={form.address} onChange={set('address')} placeholder="Küçə, bina, məhəllə" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Ulduz sayı</label>
              <select value={form.stars} onChange={set('stars')} className={inputClass}>
                <option value="">Seçin...</option>
                {[1,2,3,4,5].map(s => <option key={s} value={s}>{s} Ulduz {'⭐'.repeat(s)}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Otel Haqqında</label>
              <textarea value={form.description} onChange={set('description')} rows={4} placeholder="Otel haqqında ətraflı məlumat..." className={inputClass + ' resize-none'} />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-5">Xidmətlər & Avadanlıqlar</h2>
          <div className="flex flex-wrap gap-2">
            {AMENITIES_LIST.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => toggleAmenity(item)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  form.amenities.includes(item)
                    ? 'bg-amber-500 text-slate-900 border-amber-500'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-amber-400'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-5">Otel Şəkilləri</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {images.map((img, i) => (
              <div key={i} className="relative group aspect-video bg-slate-100 rounded-xl overflow-hidden">
                <img src={`${BACKEND_URL}${img}`} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="aspect-video border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 hover:border-amber-400 hover:text-amber-500 transition-colors text-sm"
            >
              {uploading ? '⏳' : '+ Şəkil əlavə et'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>

        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 font-semibold rounded-xl py-3 text-sm transition-colors"
        >
          {saving ? 'Yadda saxlanılır...' : '💾 Profili Yadda Saxla'}
        </button>
      </form>
    </Layout>
  );
}
