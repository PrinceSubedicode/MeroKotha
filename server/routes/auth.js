import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { db } from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'merokotha-super-secret-nepal-2026';

// Register User
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role || !phone) {
      return res.status(400).json({ message: 'All fields (name, email, password, role, phone) are required.' });
    }

    const validRoles = ['Tenant', 'Property Owner', 'Admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role choice.' });
    }

    const usersColl = db.collection('users');
    const existingUser = await usersColl.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await usersColl.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      favorites: [],
      isVerified: role === 'Tenant' ? true : false, // Owners might require Admin verification
      createdAt: new Date().toISOString()
    });

    // Create Token
    const token = jwt.sign(
      { _id: newUser._id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account registered successfully!',
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        roles: newUser.role === 'Admin' ? ['Admin'] : ['Tenant', 'Property Owner'],
        phone: newUser.phone,
        isVerified: newUser.isVerified,
        photo: newUser.photo || null,
        address: newUser.address || null,
        dob: newUser.dob || null,
        govtId: newUser.govtId || null
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const usersColl = db.collection('users');
    const user = await usersColl.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Create Token
    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roles: user.role === 'Admin' ? ['Admin'] : ['Tenant', 'Property Owner'],
        phone: user.phone,
        isVerified: user.isVerified,
        photo: user.photo || null,
        address: user.address || null,
        dob: user.dob || null,
        govtId: user.govtId || null
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// Switch Role
router.post('/switch-role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['Tenant', 'Property Owner'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role for switching.' });
    }

    const usersColl = db.collection('users');
    const user = await usersColl.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.role === 'Admin') {
      return res.status(403).json({ message: 'Admin role cannot be switched.' });
    }

    // Update active role in database
    await usersColl.findByIdAndUpdate(req.user._id, { role });

    // Generate a new token with updated role
    const token = jwt.sign(
      { _id: user._id, email: user.email, role: role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: `Switched to ${role} Mode successfully!`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: role,
        roles: ['Tenant', 'Property Owner'],
        phone: user.phone,
        isVerified: user.isVerified,
        photo: user.photo || null,
        address: user.address || null,
        dob: user.dob || null,
        govtId: user.govtId || null
      }
    });

  } catch (error) {
    console.error('Role switching error:', error);
    res.status(500).json({ message: 'Internal server error during role switch.' });
  }
});

// Get profile details
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const usersColl = db.collection('users');
    const user = await usersColl.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      roles: user.role === 'Admin' ? ['Admin'] : ['Tenant', 'Property Owner'],
      phone: user.phone,
      isVerified: user.isVerified,
      photo: user.photo || null,
      address: user.address || null,
      dob: user.dob || null,
      govtId: user.govtId || null,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Fetch profile me error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Utility to process and save user base64 uploaded profile photo locally
function saveProfileImage(base64String) {
  if (!base64String || typeof base64String !== 'string' || !base64String.startsWith('data:image/')) {
    return base64String; // Return as-is if it's already a URL
  }
  try {
    const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64String;
    }
    const fileExtension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `user_${Date.now()}_${randomSuffix}.${fileExtension}`;
    const targetPath = path.join(path.resolve('./uploads'), fileName);
    
    fs.writeFileSync(targetPath, imageBuffer);
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error('Failed to save profile image locally:', error);
    return base64String;
  }
}

// Update profile details
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, password, photo, address, dob, govtId } = req.body;

    const usersColl = db.collection('users');
    const user = await usersColl.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (dob !== undefined) updates.dob = dob;
    if (govtId !== undefined) updates.govtId = govtId;
    
    if (photo !== undefined) {
      if (!photo) {
        updates.photo = null;
      } else {
        updates.photo = saveProfileImage(photo);
      }
    }

    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await usersColl.findByIdAndUpdate(req.user._id, updates);

    res.json({
      message: 'Profile updated successfully!',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        roles: updatedUser.role === 'Admin' ? ['Admin'] : ['Tenant', 'Property Owner'],
        phone: updatedUser.phone,
        isVerified: updatedUser.isVerified,
        photo: updatedUser.photo || null,
        address: updatedUser.address || null,
        dob: updatedUser.dob || null,
        govtId: updatedUser.govtId || null
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get saved property ids for the logged-in tenant
router.get('/favorites', authenticateToken, authorizeRoles('Tenant'), async (req, res) => {
  try {
    const usersColl = db.collection('users');
    const user = await usersColl.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ favorites: Array.isArray(user.favorites) ? user.favorites : [] });
  } catch (error) {
    console.error('Fetch favorites error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Toggle a tenant saved property
router.post('/favorites/:propertyId', authenticateToken, authorizeRoles('Tenant'), async (req, res) => {
  try {
    const { propertyId } = req.params;
    const usersColl = db.collection('users');
    const propertiesColl = db.collection('properties');

    const [user, property] = await Promise.all([
      usersColl.findById(req.user._id),
      propertiesColl.findById(propertyId)
    ]);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (!property || property.status !== 'Approved') {
      return res.status(404).json({ message: 'Approved property listing not found.' });
    }

    const currentFavorites = Array.isArray(user.favorites) ? user.favorites.map(String) : [];
    const nextFavorites = currentFavorites.includes(String(propertyId))
      ? currentFavorites.filter(id => id !== String(propertyId))
      : [...currentFavorites, String(propertyId)];

    await usersColl.findByIdAndUpdate(req.user._id, { favorites: nextFavorites });

    res.json({
      message: nextFavorites.includes(String(propertyId))
        ? 'Property saved to favorites.'
        : 'Property removed from favorites.',
      favorites: nextFavorites
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
