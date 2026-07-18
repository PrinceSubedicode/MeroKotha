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
    const bookingsColl = db.collection('bookings');

    const totalUsers = await usersColl.count();
    const totalProperties = await propertiesColl.count();
    const totalInquiries = await inquiriesColl.count();
    const totalBookings = await bookingsColl.count();

    // Specific counts
    const pendingProperties = await propertiesColl.count({ status: 'Pending' });
    const approvedProperties = await propertiesColl.count({ status: 'Approved' });
    const rejectedProperties = await propertiesColl.count({ status: 'Rejected' });

    const tenantsCount = await usersColl.count({ role: 'Tenant' });
    const ownersCount = await usersColl.count({ role: 'Property Owner' });
    const adminsCount = await usersColl.count({ role: 'Admin' });

    const pendingBookings = await bookingsColl.count({ status: 'Pending' });
    const confirmedBookings = await bookingsColl.count({ status: 'Confirmed' });
    const rejectedBookings = await bookingsColl.count({ status: 'Rejected' });
    const cancelledBookings = await bookingsColl.count({ status: 'Cancelled' });
    const completedBookings = await bookingsColl.count({ status: 'Completed' });

    res.json({
      stats: {
        totalUsers,
        totalProperties,
        totalInquiries,
        totalBookings,
        properties: {
          pending: pendingProperties,
          approved: approvedProperties,
          rejected: rejectedProperties
        },
        users: {
          tenants: tenantsCount,
          owners: ownersCount,
          admins: adminsCount
        },
        bookings: {
          pending: pendingBookings,
          confirmed: confirmedBookings,
          rejected: rejectedBookings,
          cancelled: cancelledBookings,
          completed: completedBookings
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/admin/bookings: Retrieve all platform bookings
router.get('/bookings', async (req, res) => {
  try {
    const bookingsColl = db.collection('bookings');
    const bookings = await bookingsColl.find({});
    // Sort by newest first
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching admin bookings list:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Helper: Create admin notification for target user
const sendUserNotification = async (userId, title, message, type = 'info') => {
  try {
    const notificationsColl = db.collection('notifications');
    await notificationsColl.create({
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

// Helper: Register administrative audit log
const createAuditLog = async (adminId, adminName, action, targetUserId, targetUserName, details = '') => {
  try {
    const auditLogsColl = db.collection('audit_logs');
    await auditLogsColl.create({
      adminId,
      adminName,
      action,
      targetUserId,
      targetUserName,
      details,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};

// GET /api/admin/audit-logs: Retrieve administrative actions history
router.get('/audit-logs', async (req, res) => {
  try {
    const auditLogsColl = db.collection('audit_logs');
    const logs = await auditLogsColl.find({});
    // Sort newest first
    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/admin/users: Retrieve list of all platform users
router.get('/users', async (req, res) => {
  try {
    const usersColl = db.collection('users');
    const allUsers = await usersColl.find({});
    
    // Remove sensitive fields but include all detailed data for UI display/filters
    const formatted = allUsers.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      isVerified: u.isVerified || false,
      verificationStatus: u.verificationStatus || 'Not Submitted',
      verificationDetails: u.verificationDetails || null,
      photo: u.photo || null,
      address: u.address || null,
      dob: u.dob || null,
      status: u.status || 'Active',
      lastLogin: u.lastLogin || null,
      loginHistory: u.loginHistory || [],
      createdAt: u.createdAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching admin users list:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/admin/users/:id/details: Retrieve detailed user profile, activity stats and history
router.get('/users/:id/details', async (req, res) => {
  try {
    const usersColl = db.collection('users');
    const user = await usersColl.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const propertiesColl = db.collection('properties');
    const bookingsColl = db.collection('bookings');
    const auditLogsColl = db.collection('audit_logs');

    // 1. Total Properties Listed
    const totalProperties = await propertiesColl.count({ owner: user._id });

    // 2. Bookings count by status
    const bookingQuery = user.role === 'Property Owner' 
      ? { ownerId: user._id } 
      : { tenantId: user._id };

    const totalBookings = await bookingsColl.count(bookingQuery);
    const completedBookings = await bookingsColl.count({ ...bookingQuery, status: 'Completed' });
    const cancelledBookings = await bookingsColl.count({ ...bookingQuery, status: 'Cancelled' });
    const pendingBookings = await bookingsColl.count({ ...bookingQuery, status: 'Pending' });
    const confirmedBookings = await bookingsColl.count({ ...bookingQuery, status: 'Confirmed' });
    const rejectedBookings = await bookingsColl.count({ ...bookingQuery, status: 'Rejected' });

    // 3. Verification History & Logs from Audit logs
    const historyLogs = await auditLogsColl.find({ targetUserId: user._id });
    historyLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 4. Inquiries count
    const inquiriesColl = db.collection('inquiries');
    const inquiriesQuery = user.role === 'Property Owner' 
      ? { ownerId: user._id } 
      : { tenantId: user._id };
    const inquiriesCount = await inquiriesColl.count(inquiriesQuery);

    const profile = {
      dob: user.dob || null,
      address: user.address || null
    };

    const lastLogin = user.loginHistory && user.loginHistory.length > 0 
      ? user.loginHistory[0] 
      : (user.lastLogin ? { timestamp: user.lastLogin, ip: 'N/A' } : null);

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isVerified: user.isVerified || false,
        verificationStatus: user.verificationStatus || 'Not Submitted',
        verificationDetails: user.verificationDetails || null,
        photo: user.photo || null,
        dob: user.dob || null,
        address: user.address || null,
        status: user.status || 'Active',
        lastLogin: user.lastLogin || null,
        loginHistory: user.loginHistory || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt || user.createdAt
      },
      activity: {
        totalProperties,
        totalBookings,
        completedBookings,
        cancelledBookings,
        pendingBookings,
        confirmedBookings,
        rejectedBookings
      },
      history: historyLogs,
      // Flat properties for exact frontend alignment
      propertiesCount: totalProperties,
      bookingsCount: totalBookings,
      inquiriesCount,
      auditCount: historyLogs.length,
      userAuditLogs: historyLogs,
      profile,
      lastLogin
    });
  } catch (error) {
    console.error('Error fetching detailed user profile:', error);
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

    // Audit log
    const actionName = newVerifyState ? 'User Approved' : 'User Rejected';
    await createAuditLog(
      req.user._id,
      req.user.name,
      actionName,
      userToVerify._id,
      userToVerify.name,
      newVerifyState ? 'Verified owner.' : 'Revoked owner verification.'
    );

    // Notification
    await sendUserNotification(
      userToVerify._id,
      newVerifyState ? 'Account Verified' : 'Verification Revoked',
      newVerifyState 
        ? 'Congratulations! Your landlord account is verified. You can now publish approved properties.'
        : 'Your landlord verification status was revoked by an administrator.',
      newVerifyState ? 'success' : 'error'
    );

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
    const { status, rejectionReason, isRequestNewDoc } = req.body;
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

    // Audit Log & Notifications
    let actionLog = 'User Rejected';
    let notifTitle = 'Verification Rejected';
    let notifMsg = rejectionReason || 'Your identity verification documents were rejected by the administrator.';
    let notifType = 'error';

    if (status === 'Verified') {
      actionLog = 'User Approved';
      notifTitle = 'Account Verified';
      notifMsg = 'Congratulations! Your identity verification documents have been approved and verified.';
      notifType = 'success';
    } else if (isRequestNewDoc) {
      actionLog = 'Document Re-upload Requested';
      notifTitle = 'New Documents Requested';
      notifMsg = `The administrator requested a document re-upload: ${rejectionReason}`;
      notifType = 'warning';
    }

    await createAuditLog(req.user._id, req.user.name, actionLog, user._id, user.name, notifMsg);
    await sendUserNotification(user._id, notifTitle, notifMsg, notifType);

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

// PUT /api/admin/users/:id/suspend: Suspend user account
router.put('/users/:id/suspend', async (req, res) => {
  try {
    const usersColl = db.collection('users');
    const user = await usersColl.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const updated = await usersColl.findByIdAndUpdate(req.params.id, { status: 'Suspended' });
    
    // Audit Log
    await createAuditLog(req.user._id, req.user.name, 'User Suspended', user._id, user.name, 'Suspended account access temporarily.');

    // Notification
    await sendUserNotification(user._id, 'Account Suspended', 'Your account has been temporarily suspended by the administrator. Please contact support.', 'error');

    res.json({
      message: `User '${user.name}' has been suspended successfully!`,
      user: { ...updated, status: 'Suspended' }
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/admin/users/:id/activate: Activate suspended user account
router.put('/users/:id/activate', async (req, res) => {
  try {
    const usersColl = db.collection('users');
    const user = await usersColl.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const updated = await usersColl.findByIdAndUpdate(req.params.id, { status: 'Active' });
    
    // Audit Log
    await createAuditLog(req.user._id, req.user.name, 'User Activated', user._id, user.name, 'Restored account access.');

    // Notification
    await sendUserNotification(user._id, 'Account Activated', 'Your account has been successfully activated. You can now log in.', 'success');

    res.json({
      message: `User '${user.name}' has been activated successfully!`,
      user: { ...updated, status: 'Active' }
    });
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/admin/users/:id: Soft delete or force delete user account
router.delete('/users/:id', async (req, res) => {
  try {
    const { force } = req.query;
    const usersColl = db.collection('users');
    const user = await usersColl.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Safety checks before deletion
    if (force !== 'true') {
      const propertiesColl = db.collection('properties');
      const bookingsColl = db.collection('bookings');

      // 1. Listed properties count
      const listedPropertiesCount = await propertiesColl.count({
        owner: user._id,
        status: { $in: ['Approved', 'Pending'] }
      });

      // 2. Active bookings count
      const activeBookingsCount = await bookingsColl.count({
        $or: [
          { tenantId: user._id, status: 'Confirmed' },
          { ownerId: user._id, status: 'Confirmed' }
        ]
      });

      // 3. Active rental agreements count (matching confirmed bookings in this domain)
      const activeRentalAgreementsCount = activeBookingsCount;

      // 4. Pending bookings count
      const pendingBookingsCount = await bookingsColl.count({
        $or: [
          { tenantId: user._id, status: 'Pending' },
          { ownerId: user._id, status: 'Pending' }
        ]
      });

      // 5. Verification records existence
      const hasVerificationRecords = !!(user.isVerified || user.verificationStatus === 'Verified' || user.verificationStatus === 'Under Review' || user.verificationDetails);

      if (listedPropertiesCount > 0 || activeBookingsCount > 0 || pendingBookingsCount > 0 || hasVerificationRecords) {
        return res.status(200).json({
          success: false,
          warning: true,
          message: 'Safety check warning: User has active items or verification records on the platform.',
          details: {
            listedProperties: listedPropertiesCount,
            activeBookings: activeBookingsCount,
            activeRentalAgreements: activeRentalAgreementsCount,
            pendingBookings: pendingBookingsCount,
            hasVerificationRecords: hasVerificationRecords ? 1 : 0
          }
        });
      }
    }

    // Perform soft delete (mark status as Deleted)
    const updated = await usersColl.findByIdAndUpdate(req.params.id, { status: 'Deleted' });

    // Deactivate their properties if they are owner
    if (user.role === 'Property Owner') {
      const propertiesColl = db.collection('properties');
      await propertiesColl.updateMany({ owner: user._id }, { status: 'Suspended' });
    }

    // Audit Log
    await createAuditLog(req.user._id, req.user.name, 'User Deleted', user._id, user.name, `Soft-deleted user account (force=${force === 'true'}).`);

    // Notification
    await sendUserNotification(user._id, 'Account Deleted', 'Your account has been deleted by the administrator.', 'error');

    res.json({
      success: true,
      message: `User '${user.name}' has been soft-deleted successfully!`,
      user: { ...updated, status: 'Deleted' }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
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
