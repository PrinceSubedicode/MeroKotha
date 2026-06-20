import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// POST /api/inquiries: Send a rental inquiry to an owner
router.post('/', authenticateToken, authorizeRoles('Tenant'), async (req, res) => {
  try {
    const { propertyId, message } = req.body;

    if (!propertyId || !message) {
      return res.status(400).json({ message: 'Property ID and message are required.' });
    }

    const propertiesColl = db.collection('properties');
    const property = await propertiesColl.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'The selected property does not exist.' });
    }

    // Resolve Tenant Profile
    const usersColl = db.collection('users');
    const tenant = await usersColl.findById(req.user._id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant profile not found.' });
    }

    const inquiriesColl = db.collection('inquiries');
    const newInquiry = await inquiriesColl.create({
      propertyId: property._id,
      propertyTitle: property.title,
      ownerId: property.owner,
      tenantId: tenant._id,
      tenantName: tenant.name,
      tenantEmail: tenant.email,
      tenantPhone: tenant.phone,
      message,
      status: 'Pending' // Initial state
    });

    res.status(201).json({
      message: 'Inquiry sent successfully to the owner! They will reach out to you soon.',
      inquiry: newInquiry
    });

  } catch (error) {
    console.error('Inquiry sending failed:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/inquiries/tenant: Retrieve inquiries sent by the logged-in tenant
router.get('/tenant', authenticateToken, authorizeRoles('Tenant'), async (req, res) => {
  try {
    const inquiriesColl = db.collection('inquiries');
    const inquiries = await inquiriesColl.find({ tenantId: req.user._id });

    // Sort by newest first
    inquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(inquiries);
  } catch (error) {
    console.error('Failed fetching tenant inquiries:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/inquiries/owner: Retrieve inquiries received by the logged-in owner
router.get('/owner', authenticateToken, authorizeRoles('Property Owner'), async (req, res) => {
  try {
    const inquiriesColl = db.collection('inquiries');
    const inquiries = await inquiriesColl.find({ ownerId: req.user._id });

    // Sort by newest first
    inquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(inquiries);
  } catch (error) {
    console.error('Failed fetching owner inquiries:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/inquiries/:id/status: Update inquiry contact status (Pending/Contacted/Resolved)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['Pending', 'Contacted', 'Resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid or missing status choice.' });
    }

    const inquiriesColl = db.collection('inquiries');
    const inquiry = await inquiriesColl.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }

    // Permission: Only the property owner or the tenant associated with this inquiry
    const isOwner = String(inquiry.ownerId) === String(req.user._id);
    const isTenant = String(inquiry.tenantId) === String(req.user._id);
    
    if (!isOwner && !isTenant && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Unauthorized status modification.' });
    }

    const updated = await inquiriesColl.findByIdAndUpdate(req.params.id, { status });

    res.json({
      message: `Inquiry status updated to ${status} successfully!`,
      inquiry: updated
    });

  } catch (error) {
    console.error('Update inquiry status error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
