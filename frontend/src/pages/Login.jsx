import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-900 font-bold text-3xl mx-auto mb-4">
            F
          </div>
          <h1 className="text-2xl font-bold text-white">FARARUD Partner Portal</h1>
          <p className="text-slate-400 mt-1 text-sm">Otel hesabınıza daxil olun</p>
        </div>

        {/* Form */}
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="hotel@example.com"
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Şifrə</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 placeholder-slate-400"
              />
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
              {loading ? 'Giriş edilir...' : 'Daxil Ol'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Hesabınız yoxdur?{' '}
            <Link to="/register" className="text-amber-400 hover:text-amber-300 font-medium">
              Qeydiyyatdan keçin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
