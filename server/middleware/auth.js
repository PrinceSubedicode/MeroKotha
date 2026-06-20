import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'merokotha-super-secret-nepal-2026';

// General Authenticate Middleware
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting 'Bearer TOKEN'

  if (!token) {
    return res.status(401).json({ message: 'No authentication token provided. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Verification error:', error);
    return res.status(403).json({ message: 'Session expired or invalid token. Please log in again.' });
  }
}

// Check role permission
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User is not authenticated' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Protected Resource: Access Denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}` 
      });
    }
    
    next();
  };
}
