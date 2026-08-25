const API_BASE = import.meta.env.VITE_API_URL || 'https://fararud-partners.onrender.com/api';

function getToken() {
  return localStorage.getItem('partner_token');
}

async function request(method, path, data = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (data) options.body = JSON.stringify(data);

  const res = await fetch(`${API_BASE}${path}`, options);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Xəta baş verdi.');
  return json;
}

async function upload(path, formData) {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Yükləmə xətası.');
  return json;
}

export const api = {
  // Auth
  register: (data) => request('POST', '/auth/register', data),
  login: (data) => request('POST', '/auth/login', data),
  me: () => request('GET', '/auth/me'),

  // Hotel profile
  getHotel: () => request('GET', '/hotels/me'),
  updateHotel: (data) => request('PUT', '/hotels/me', data),
  uploadHotelImage: (formData) => upload('/hotels/upload', formData),
  deleteHotelImage: (url) => request('DELETE', '/hotels/images', { url }),

  // Rooms
  getRooms: () => request('GET', '/rooms'),
  createRoom: (data) => request('POST', '/rooms', data),
  updateRoom: (id, data) => request('PUT', `/rooms/${id}`, data),
  deleteRoom: (id) => request('DELETE', `/rooms/${id}`),
  uploadRoomImage: (id, formData) => upload(`/rooms/${id}/upload`, formData),
};

export const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://fararud-partners.onrender.com';
