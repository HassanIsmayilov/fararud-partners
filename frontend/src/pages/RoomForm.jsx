import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, BACKEND_URL } from '../services/api';
import Layout from '../components/Layout';

const ROOM_TYPES = ['standard', 'deluxe', 'suite', 'family', 'single', 'double', 'twin', 'penthouse'];
const BED_TYPES = ['Tək Çarpayı (Single)', 'İki Nəfərlik Çarpayı (Double/Queen)', 'Böyük Çarpayı (King Size)', 'İki Ayrı Çarpayı (Twin Beds)', 'Ailə Çarpayısı'];
const CURRENCIES = ['USD', 'AZN', 'UZS', 'EUR'];
const ROOM_AMENITIES = [
  'WiFi', 'Klima', 'Mini Bar', 'Seyf', 'TV', 'Saç Quruducu', 'Hamam',
  'Duş', 'Jakuzi', 'Balkon', 'Şəhər Mənzərəsi', 'Dəniz Mənzərəsi', 'İş Masası',
  'Çay/Qəhvə Komplekti', 'Soyuducu',
];

export default function RoomForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const fileRef = useRef();
  const videoFileRef = useRef();

  const [form, setForm] = useState({
    name: '', type: 'standard', price_per_night: '', currency: 'USD',
    capacity: 2, bed_type: '', bed_count: 1, bathroom_count: 1, room_count: 1, size_sqm: '', floor: '',
    amenities: [], total_rooms: 1, video_url: '',
  });
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
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
            bed_count: room.bed_count || 1,
            bathroom_count: room.bathroom_count || 1,
            room_count: room.room_count || 1,
            size_sqm: room.size_sqm || '',
            floor: room.floor || '',
            amenities: room.amenities || [],
            total_rooms: room.total_rooms || 1,
            video_url: room.video_url || '',
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
      const payload = {
        ...form,
        price_per_night: parseFloat(form.price_per_night),
        capacity: parseInt(form.capacity) || 2,
        bed_count: parseInt(form.bed_count) || 1,
        bathroom_count: parseInt(form.bathroom_count) || 1,
        room_count: parseInt(form.room_count) || 1,
        total_rooms: parseInt(form.total_rooms) || 1,
        size_sqm: form.size_sqm ? parseInt(form.size_sqm) : null,
        floor: form.floor ? parseInt(form.floor) : null,
        images,
      };

      if (isEdit) {
        await api.updateRoom(id, payload);
        setMessage({ type: 'success', text: '✅ Otaq uğurla güncəlləndi!' });
      } else {
        await api.createRoom(payload);
        navigate('/rooms');
      }
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
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.uploadRoomDirect(formData);
      setImages(prev => [...prev, res.url]);
      setMessage({ type: 'success', text: '✅ Otaq şəkli əlavə edildi!' });
    } catch (err) {
      setMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingVideo(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.uploadRoomDirect(formData);
      setForm(prev => ({ ...prev, video_url: res.url }));
      setMessage({ type: 'success', text: '✅ Otaq videosu uğurla yükləndi!' });
    } catch (err) {
      setMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setUploadingVideo(false);
      if (videoFileRef.current) videoFileRef.current.value = '';
    }
  };

  const handleDeleteImage = async (url) => {
    if (!confirm('Bu otaq şəklini silmək istəyirsiniz?')) return;
    try {
      if (isEdit) {
        await api.deleteRoomImage(id, url).catch(() => {});
      }
      setImages(prev => prev.filter(img => img !== url));
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const inputClass = "w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50";
  const labelClass = "block text-sm font-medium text-slate-600 mb-2";

  if (loading) return (
    <Layout title="Otaq">
      <div className="text-center py-12 text-slate-400">Yüklənir...</div>
    </Layout>
  );

  const getImg = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${BACKEND_URL}${url}`;
  };

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
              <label className={labelClass}>Çarpayı Sayı</label>
              <input type="number" min="1" value={form.bed_count} onChange={set('bed_count')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Hamam/Tualet Sayı</label>
              <input type="number" min="1" value={form.bathroom_count} onChange={set('bathroom_count')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Otaq Sayı (Daxili)</label>
              <input type="number" min="1" value={form.room_count} onChange={set('room_count')} className={inputClass} title="Məsələn: 1 yataq, 1 qonaq otağı = 2" />
            </div>
            <div>
              <label className={labelClass}>Ümumi Otaq Sayı (Oteldə)</label>
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

        {/* Images */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-2">📸 Otaq Şəkilləri</h2>
          <p className="text-xs text-slate-400 mb-4">Otağın şəkillərini əlavə edin (JPG, PNG, WebP)</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {images.map((img, i) => (
              <div key={i} className="relative group aspect-video bg-slate-100 rounded-xl overflow-hidden shadow-inner">
                <img
                  src={getImg(img)}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer shadow-md"
                  title="Şəkli sil"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="aspect-video border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 hover:border-amber-400 hover:text-amber-500 transition-colors text-sm cursor-pointer"
            >
              {uploading ? '⏳ Yüklənir...' : '+ Şəkil əlavə et'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>

        {/* Video Section */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-2">🎥 Otaq Videosu</h2>
          <p className="text-xs text-slate-400 mb-4">Otağın video icmalını əlavə edin (MP4 video faylı və ya YouTube linki)</p>
          
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Video Linki (YouTube və ya MP4 Link)</label>
              <input
                value={form.video_url || ''}
                onChange={set('video_url')}
                placeholder="https://youtube.com/watch?v=... və ya https://site.com/video.mp4"
                className={inputClass}
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">və ya fayldan yükləyin:</span>
              <button
                type="button"
                onClick={() => videoFileRef.current?.click()}
                disabled={uploadingVideo}
                className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300/60 text-amber-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
              >
                {uploadingVideo ? '⏳ Video yüklənir...' : '📁 Kompüterdən Video Yüklə (.mp4, .webm)'}
              </button>
              <input
                ref={videoFileRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoUpload}
              />
            </div>

            {/* Video Preview */}
            {form.video_url && (
              <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">Otaq Video Baxışı:</span>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, video_url: '' })}
                    className="text-xs text-red-500 hover:underline cursor-pointer font-semibold"
                  >
                    Videonu Sil
                  </button>
                </div>
                <div className="aspect-video rounded-xl overflow-hidden bg-black max-w-md mx-auto shadow-md">
                  {form.video_url.includes('youtube.com') || form.video_url.includes('youtu.be') ? (
                    <iframe
                      src={form.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      title="Room video"
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={getImg(form.video_url)}
                      controls
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

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
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl py-3 text-sm transition-colors cursor-pointer"
          >
            ← Geri
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 font-semibold rounded-xl py-3 text-sm transition-colors cursor-pointer"
          >
            {saving ? 'Yadda saxlanılır...' : isEdit ? '💾 Güncəllə' : '➕ Otağı Əlavə Et'}
          </button>
        </div>
      </form>
    </Layout>
  );
}
