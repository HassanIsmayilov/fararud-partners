import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, BACKEND_URL } from '../services/api';
import Layout from '../components/Layout';

const ROOM_TYPES = ['standard', 'deluxe', 'suite', 'family', 'single', 'double', 'twin', 'penthouse'];
const CURRENCIES = ['USD', 'EUR', 'IRR', 'IQD', 'AZN'];
const BED_TYPES = ['Tək (Single)', 'Cüt (Double)', 'King Size', 'Queen Size', 'İki Ayrı (Twin)', 'Divanlar'];
const ROOM_AMENITIES = [
  'WiFi', 'Klima', 'Mini Bar', 'Seyf', 'TV', 'Saç Quruducu',
  'Hamam', 'Duş', 'Jakuzi', 'Balkon', 'Şəhər Mənzərəsi', 'Dəniz Mənzərəsi',
  'İş Masası', 'Çay/Qəhvə Komplekti', 'Soyuducu',
];

export default function RoomForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const fileRef = useRef();

  const [form, setForm] = useState({
    name: '', type: 'standard', price_per_night: '', currency: 'USD',
    capacity: 2, bed_type: '', size_sqm: '', floor: '',
    amenities: [], total_rooms: 1,
  });
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      api.getRooms().then(res => {
        const room = res.rooms.find(r => r.id === id);
        if (room) {
          setForm({
            name: room.name || '',
            type: room.type || 'standard',
            price_per_night: room.price_per_night || '',
            currency: room.currency || 'USD',
            capacity: room.capacity || 2,
            bed_type: room.bed_type || '',
            size_sqm: room.size_sqm || '',
            floor: room.floor || '',
            amenities: room.amenities || [],
            total_rooms: room.total_rooms || 1,
          });
          setImages(room.images || []);
        }
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const toggleAmenity = (item) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(item)
        ? prev.amenities.filter(a => a !== item)
        : [...prev.amenities, item],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      if (isEdit) {
        await api.updateRoom(id, form);
        setMessage({ type: 'success', text: '✅ Otaq güncəlləndi!' });
        setTimeout(() => navigate('/rooms'), 1200);
      } else {
        await api.createRoom(form);
        setMessage({ type: 'success', text: '✅ Otaq əlavə edildi!' });
        setTimeout(() => navigate('/rooms'), 1200);
      }
    } catch (err) {
      setMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    if (!isEdit) return;
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.uploadRoomImage(id, formData);
      setImages(prev => [...prev, res.url]);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const inputClass = "w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50";
  const labelClass = "block text-sm font-medium text-slate-600 mb-2";

  if (loading) return (
    <Layout title="Otaq">
      <div className="text-center py-12 text-slate-400">Yüklənir...</div>
    </Layout>
  );

  return (
    <Layout title={isEdit ? '✏️ Otağı Düzənlə' : '➕ Yeni Otaq Əlavə Et'}>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-5">Otaq Məlumatları</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Otaq Adı *</label>
              <input required value={form.name} onChange={set('name')} placeholder="Standart İki Nəfərlik" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Otaq Növü</label>
              <select value={form.type} onChange={set('type')} className={inputClass}>
                {ROOM_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Çarpayı Növü</label>
              <select value={form.bed_type} onChange={set('bed_type')} className={inputClass}>
                <option value="">Seçin...</option>
                {BED_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Gecəlik Qiymət *</label>
              <input required type="number" min="1" step="0.01" value={form.price_per_night} onChange={set('price_per_night')} placeholder="50" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Valyuta</label>
              <select value={form.currency} onChange={set('currency')} className={inputClass}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Tutum (Nəfər)</label>
              <input type="number" min="1" max="20" value={form.capacity} onChange={set('capacity')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Ümumi Otaq Sayı</label>
              <input type="number" min="1" value={form.total_rooms} onChange={set('total_rooms')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Sahə (m²)</label>
              <input type="number" min="1" value={form.size_sqm} onChange={set('size_sqm')} placeholder="25" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Mərtəbə</label>
              <input type="number" value={form.floor} onChange={set('floor')} placeholder="3" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-5">Otaq Xidmətləri</h2>
          <div className="flex flex-wrap gap-2">
            {ROOM_AMENITIES.map(item => (
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

        {/* Images (only in edit mode) */}
        {isEdit && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-5">Otaq Şəkilləri</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {images.map((img, i) => (
                <div key={i} className="aspect-video bg-slate-100 rounded-xl overflow-hidden">
                  <img src={`${BACKEND_URL}${img}`} alt="" className="w-full h-full object-cover" />
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
            {!isEdit && <p className="text-xs text-slate-400">Şəkil əlavə etmək üçün əvvəlcə otağı yaradın.</p>}
          </div>
        )}

        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/rooms')}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            ← Geri
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            {saving ? 'Yadda saxlanılır...' : isEdit ? '💾 Güncəllə' : '➕ Otağı Əlavə Et'}
          </button>
        </div>
      </form>
    </Layout>
  );
}
