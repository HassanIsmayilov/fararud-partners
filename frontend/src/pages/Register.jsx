import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CITIES = ['Tehran', 'Bağdad', 'Məşhəd', 'İsfahan', 'Şiraz', 'Kərbəla', 'Nəcəf', 'Basra', 'Ərbil', 'Mosul'];
const COUNTRIES = ['Iran', 'Iraq'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', city: '', country: 'Iran', address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      return setError('Şifrələr uyğun gəlmir.');
    }
    if (form.password.length < 6) {
      return setError('Şifrə ən az 6 simvol olmalıdır.');
    }

    setLoading(true);
    try {
      await register({
        name: form.name, email: form.email, password: form.password,
        phone: form.phone, city: form.city, country: form.country, address: form.address,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 placeholder-slate-400";
  const labelClass = "block text-sm font-medium text-slate-300 mb-2";

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-900 font-bold text-3xl mx-auto mb-4">F</div>
          <h1 className="text-2xl font-bold text-white">Otel Qeydiyyatı</h1>
          <p className="text-slate-400 mt-1 text-sm">FARARUD Partner Portalına qoşulun</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
          {/* Info banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm px-4 py-3 rounded-xl mb-6">
            ℹ️ Qeydiyyatdan sonra otelini admin tərəfindən təsdiq gözləyir. Saytda görünmək üçün təsdiq lazımdır.
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Otel Adı *</label>
                <input type="text" required value={form.name} onChange={set('name')} placeholder="Grand Hotel Tehran" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Email *</label>
                <input type="email" required value={form.email} onChange={set('email')} placeholder="info@hotel.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Telefon</label>
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+98 21 1234 5678" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Şifrə *</label>
                <input type="password" required value={form.password} onChange={set('password')} placeholder="Min. 6 simvol" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Şifrə Təkrar *</label>
                <input type="password" required value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Şifrəni təkrar yazın" className={inputClass} />
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
                <input type="text" value={form.address} onChange={set('address')} placeholder="Küçə, bina, ünvan" className={inputClass} />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              {loading ? 'Qeydiyyat edilir...' : '🏨 Qeydiyyatdan Keç'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Artıq hesabınız var?{' '}
            <Link to="/login" className="text-amber-400 hover:text-amber-300 font-medium">Daxil olun</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
