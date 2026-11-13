import jwt from 'jsonwebtoken';
import { dataService } from '../services/dataService.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'robotics_club_super_secure_jwt_key_2026';

export const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, getJwtSecret(), { expiresIn: '7d' });
};

export const protect = async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Fast demo role-switch header support (set ENABLE_DEMO_AUTH=false in production)
  const demoAuthEnabled = process.env.ENABLE_DEMO_AUTH !== 'false';
  const demoUserId = demoAuthEnabled ? req.headers['x-demo-user-id'] : null;
  if (demoUserId) {
    const demoUser = await dataService.findUserById(demoUserId);
    if (demoUser) {
      if (demoUser.status === 'SUSPENDED') {
        return res.status(403).json({ success: false, message: 'Your account has been suspended by an administrator' });
      }
      req.user = { ...demoUser, role: String(demoUser.role || 'MEMBER').toUpperCase() };
      return next();
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await dataService.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User belonging to token no longer exists' });
    }
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended by an administrator' });
    }

    req.user = { ...user, role: String(user.role || 'MEMBER').toUpperCase() };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', error: error.message });
  }
};

export const authorize = (...roles) => {
  const allowedRoles = roles.map((r) => String(r).toUpperCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const userRole = String(req.user.role || '').toUpperCase();
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: Role '${userRole || req.user.role}' is not authorized to perform this action. Required: [${allowedRoles.join(', ')}]` 
      });
    }
    next();
  };
};
