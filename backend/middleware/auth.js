import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fararud-partners-secret-2025';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Token tapılmadı. Giriş edin.' });
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.hotel = decoded; // { id, email, name }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token etibarsızdır. Yenidən giriş edin.' });
  }
}
