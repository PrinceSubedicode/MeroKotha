import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Apply administrative role guard
router.use(authenticateToken, authorizeRoles('Admin'));

// GET /api/admin/stats: Real platform analytics
router.get('/stats', async (req, res) => {
  try {
    const usersColl = db.collection('users');
    const propertiesColl = db.collection('properties');
    const inquiriesColl = db.collection('inquiries');

    const totalUsers = await usersColl.count();
    const totalProperties = await propertiesColl.count();
    const totalInquiries = await inquiriesColl.count();

    // Specific counts
    const pendingProperties = await propertiesColl.count({ status: 'Pending' });
    const approvedProperties = await propertiesColl.count({ status: 'Approved' });
    const rejectedProperties = await propertiesColl.count({ status: 'Rejected' });

    const tenantsCount = await usersColl.count({ role: 'Tenant' });
    const ownersCount = await usersColl.count({ role: 'Property Owner' });
    const adminsCount = await usersColl.count({ role: 'Admin' });

    res.json({
      stats: {
        totalUsers,
        totalProperties,
        totalInquiries,
        properties: {
          pending: pendingProperties,
          approved: approvedProperties,
          rejected: rejectedProperties
        },
        users: {
          tenants: tenantsCount,
          owners: ownersCount,
          admins: adminsCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/admin/users: Retrieve list of all platform users
router.get('/users', async (req, res) => {
  try {
    const usersColl = db.collection('users');
    const allUsers = await usersColl.find({});
    
    // Remove sensitive fields
    const formatted = allUsers.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      isVerified: u.isVerified || false,
      verificationStatus: u.verificationStatus || 'Not Submitted',
      verificationDetails: u.verificationDetails || null,
      createdAt: u.createdAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching admin users list:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/admin/properties: Retrieve list of all platform properties for review
router.get('/properties', async (req, res) => {
  try {
    const propertiesColl = db.collection('properties');
    const allProps = await propertiesColl.find({});

    // Resolve owner summaries
    const usersColl = db.collection('users');
    const resolved = await Promise.all(
      allProps.map(async (p) => {
        const owner = await usersColl.findById(p.owner);
        return {
          ...p,
          ownerInfo: owner ? { name: owner.name, phone: owner.phone, email: owner.email } : null
        };
      })
    );

    // Sort newest first
    resolved.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(resolved);
  } catch (error) {
    console.error('Admin all properties list fetch failed:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/admin/users/:id/verify: Verify or unverify an owner
router.put('/users/:id/verify', async (req, res) => {
  try {
    const usersColl = db.collection('users');
    const userToVerify = await usersColl.findById(req.params.id);

    if (!userToVerify) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const newVerifyState = !userToVerify.isVerified;
    const updates = { isVerified: newVerifyState };
    
    if (newVerifyState) {
      updates.verificationStatus = 'Verified';
      updates.verificationDetails = {
        ...(userToVerify.verificationDetails || {}),
        verifiedDate: new Date().toISOString(),
        rejectionReason: null
      };
    } else {
      updates.verificationStatus = 'Rejected';
      updates.verificationDetails = {
        ...(userToVerify.verificationDetails || {}),
        rejectionReason: 'Revoked by administrator'
      };
    }

    const updated = await usersColl.findByIdAndUpdate(req.params.id, updates);

    res.json({
      message: `User '${userToVerify.name}' verification state set to ${newVerifyState}`,
      user: {
        _id: updated._id,
        name: updated.name,
        role: updated.role,
        isVerified: updated.isVerified,
        verificationStatus: updated.verificationStatus
      }
    });

  } catch (error) {
    console.error('Admin user verification toggle failed:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/admin/users/:id/verification-review: Approve or Reject identity verification documents
router.put('/users/:id/verification-review', async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!status || !['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status update. Must be Verified or Rejected.' });
    }

    const usersColl = db.collection('users');
    const user = await usersColl.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const updates = {
      verificationStatus: status,
      isVerified: status === 'Verified'
    };

    const currentDetails = user.verificationDetails || {};
    updates.verificationDetails = {
      ...currentDetails,
      verifiedDate: status === 'Verified' ? new Date().toISOString() : null,
      rejectionReason: status === 'Rejected' ? (rejectionReason || 'Documents rejected by administrator.') : null
    };

    const updated = await usersColl.findByIdAndUpdate(req.params.id, updates);

    res.json({
      message: `User identity verification status set to '${status}' successfully!`,
      user: {
        _id: updated._id,
        name: updated.name,
        role: updated.role,
        isVerified: updated.isVerified,
        verificationStatus: updated.verificationStatus,
        verificationDetails: updated.verificationDetails
      }
    });

  } catch (error) {
    console.error('Admin user verification review failed:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/admin/properties/:id/status: Approve or Reject a listing
router.put('/properties/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status update command.' });
    }

    const propertiesColl = db.collection('properties');
    const property = await propertiesColl.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property listing not found.' });
    }

    const updated = await propertiesColl.findByIdAndUpdate(req.params.id, { status });

    res.json({
      message: `Property listing status updated to '${status}' successfully!`,
      property: updated
    });

  } catch (error) {
    console.error('Admin property status change failed:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/admin/properties/:id: Directly delete a listing
router.delete('/properties/:id', async (req, res) => {
  try {
    const propertiesColl = db.collection('properties');
    const property = await propertiesColl.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property listing not found.' });
    }

    // Delete related inquiries too
    const inquiriesColl = db.collection('inquiries');
    await inquiriesColl.deleteMany({ propertyId: req.params.id });

    // Delete property
    await propertiesColl.findByIdAndDelete(req.params.id);

    res.json({ message: 'Listing and related inquiries successfully purged from platform.' });

  } catch (error) {
    console.error('Admin property deletion error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
