import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Helper: Check if two date ranges overlap
function datesOverlap(start1Str, end1Str, start2Str, end2Str) {
  const start1 = new Date(start1Str);
  const start2 = new Date(start2Str);
  
  // Normalize times to midnight for accurate date comparison
  start1.setHours(0, 0, 0, 0);
  start2.setHours(0, 0, 0, 0);

  const end1 = end1Str ? new Date(end1Str) : null;
  const end2 = end2Str ? new Date(end2Str) : null;
  
  if (end1) end1.setHours(0, 0, 0, 0);
  if (end2) end2.setHours(0, 0, 0, 0);

  if (!end1 && !end2) {
    // Both are open-ended stays starting on or after the later start date
    return true;
  }
  if (!end1) {
    // Existing is open-ended. Overlaps if the new booking ends on or after the existing start
    return end2 >= start1;
  }
  if (!end2) {
    // New booking is open-ended. Overlaps if existing ends on or after the new start
    return end1 >= start2;
  }
  // Both have end dates
  return start1 <= end2 && start2 <= end1;
}

// POST /api/bookings: Tenant creates a booking request
router.post('/', authenticateToken, authorizeRoles('Tenant'), async (req, res) => {
  try {
    const { propertyId, checkInDate, checkOutDate, moveInDate, occupants, message } = req.body;

    const startDateStr = moveInDate || checkInDate;
    if (!propertyId || !startDateStr) {
      return res.status(400).json({ message: 'Property ID and Move-in / Check-in date are required.' });
    }

    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);

    if (startDate < today) {
      return res.status(400).json({ message: 'The check-in / move-in date cannot be in the past.' });
    }

    if (checkOutDate) {
      const endDate = new Date(checkOutDate);
      endDate.setHours(0, 0, 0, 0);
      if (endDate <= startDate) {
        return res.status(400).json({ message: 'The check-out date must be after the check-in date.' });
      }
    }

    // Retrieve property
    const propertiesColl = db.collection('properties');
    const property = await propertiesColl.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'The selected property does not exist.' });
    }

    if (property.status !== 'Approved') {
      return res.status(400).json({ message: 'This property listing is not approved and cannot be booked.' });
    }

    // Check if tenant is trying to book their own property
    if (String(property.owner) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot book your own property listing.' });
    }

    // Retrieve tenant info
    const usersColl = db.collection('users');
    const tenant = await usersColl.findById(req.user._id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant profile not found.' });
    }

    // Check for existing pending bookings for this tenant on the same property
    const bookingsColl = db.collection('bookings');
    const duplicatePending = await bookingsColl.findOne({
      propertyId,
      tenantId: tenant._id,
      status: 'Pending'
    });

    if (duplicatePending) {
      return res.status(400).json({ message: 'You already have a pending booking request for this property.' });
    }

    // Check for overlapping confirmed bookings for this property
    const confirmedBookings = await bookingsColl.find({
      propertyId,
      status: 'Confirmed'
    });

    for (const cb of confirmedBookings) {
      const cbStart = cb.moveInDate || cb.checkInDate;
      const cbEnd = cb.checkOutDate;
      if (datesOverlap(startDateStr, checkOutDate, cbStart, cbEnd)) {
        return res.status(400).json({ 
          message: 'This property is already booked for the selected dates.' 
        });
      }
    }

    // Create Booking
    const newBooking = await bookingsColl.create({
      propertyId: property._id,
      propertyTitle: property.title,
      propertyImage: property.images[0] || '',
      propertyCity: property.city,
      propertyLocation: property.location,
      tenantId: tenant._id,
      tenantName: tenant.name,
      tenantEmail: tenant.email,
      tenantPhone: tenant.phone,
      ownerId: property.owner,
      checkInDate: checkInDate || '',
      checkOutDate: checkOutDate || '',
      moveInDate: moveInDate || '',
      occupants: Number(occupants || 1),
      message: message || '',
      status: 'Pending',
      cancellationReason: '',
      cancellationDate: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Send Notifications
    const notificationsColl = db.collection('notifications');
    
    // Notification for tenant
    await notificationsColl.create({
      userId: tenant._id,
      title: 'Booking Request Submitted',
      message: `Your booking request for "${property.title}" has been submitted successfully and is pending owner approval.`,
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    // Notification for owner
    await notificationsColl.create({
      userId: property.owner,
      title: 'New Booking Request',
      message: `You received a new booking request from ${tenant.name} for your property "${property.title}".`,
      type: 'info',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Booking request submitted successfully!',
      booking: newBooking
    });

  } catch (error) {
    console.error('Booking submission failed:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/bookings/tenant: Get all bookings made by the logged-in tenant
router.get('/tenant', authenticateToken, authorizeRoles('Tenant'), async (req, res) => {
  try {
    const bookingsColl = db.collection('bookings');
    const bookings = await bookingsColl.find({ tenantId: req.user._id });

    // Sort by newest first
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(bookings);
  } catch (error) {
    console.error('Failed to fetch tenant bookings:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/bookings/owner: Get all bookings for properties owned by the logged-in owner
router.get('/owner', authenticateToken, authorizeRoles('Property Owner'), async (req, res) => {
  try {
    const bookingsColl = db.collection('bookings');
    const bookings = await bookingsColl.find({ ownerId: req.user._id });

    // Sort by newest first
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(bookings);
  } catch (error) {
    console.error('Failed to fetch owner bookings:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/bookings/admin: Admin retrieves all bookings
router.get('/admin', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const bookingsColl = db.collection('bookings');
    const bookings = await bookingsColl.find({});
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(bookings);
  } catch (error) {
    console.error('Failed to fetch admin bookings:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/bookings/:id/status: Update booking status (Accept/Reject/Cancel/Complete)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;
    const allowedStatuses = ['Confirmed', 'Rejected', 'Cancelled', 'Completed'];
    
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status update request.' });
    }

    const bookingsColl = db.collection('bookings');
    const booking = await bookingsColl.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const propertiesColl = db.collection('properties');
    const property = await propertiesColl.findById(booking.propertyId);

    const isOwner = String(booking.ownerId) === String(req.user._id);
    const isTenant = String(booking.tenantId) === String(req.user._id);
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isTenant && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized status modification.' });
    }

    const notificationsColl = db.collection('notifications');

    // Transitions
    if (status === 'Confirmed') {
      // Owner/Admin accepts the booking
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Only the property landlord or administrator can accept booking requests.' });
      }
      if (booking.status !== 'Pending') {
        return res.status(400).json({ message: 'Only pending bookings can be confirmed.' });
      }

      // Overlap double check before confirming
      const confirmedBookings = await bookingsColl.find({
        propertyId: booking.propertyId,
        status: 'Confirmed'
      });

      const start = booking.moveInDate || booking.checkInDate;
      const end = booking.checkOutDate;

      for (const cb of confirmedBookings) {
        if (String(cb._id) === String(booking._id)) continue;
        const cbStart = cb.moveInDate || cb.checkInDate;
        const cbEnd = cb.checkOutDate;
        if (datesOverlap(start, end, cbStart, cbEnd)) {
          return res.status(400).json({ 
            message: 'Overlapping stay found. Another booking has already been confirmed for this duration.' 
          });
        }
      }

      // Update booking
      const updated = await bookingsColl.findByIdAndUpdate(req.params.id, { 
        status: 'Confirmed',
        updatedAt: new Date().toISOString()
      });

      // Send Notification to Tenant
      await notificationsColl.create({
        userId: booking.tenantId,
        title: 'Booking Confirmed',
        message: `Your booking request for "${booking.propertyTitle}" has been accepted!`,
        type: 'success',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      return res.json({ message: 'Booking accepted and status updated to Confirmed.', booking: updated });
    }

    if (status === 'Rejected') {
      // Owner/Admin declines the booking
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Only the property landlord or administrator can reject booking requests.' });
      }
      if (booking.status !== 'Pending') {
        return res.status(400).json({ message: 'Only pending bookings can be rejected.' });
      }

      const updated = await bookingsColl.findByIdAndUpdate(req.params.id, { 
        status: 'Rejected',
        updatedAt: new Date().toISOString()
      });

      // Send Notification to Tenant
      await notificationsColl.create({
        userId: booking.tenantId,
        title: 'Booking Request Declined',
        message: `Your booking request for "${booking.propertyTitle}" was declined by the landlord.`,
        type: 'error',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      return res.json({ message: 'Booking request declined successfully.', booking: updated });
    }

    if (status === 'Cancelled') {
      // Tenant cancels booking or Owner cancels booking
      if (booking.status !== 'Pending' && booking.status !== 'Confirmed') {
        return res.status(400).json({ message: 'Only pending or confirmed bookings can be cancelled.' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const moveIn = new Date(booking.moveInDate || booking.checkInDate);
      moveIn.setHours(0, 0, 0, 0);

      if (isTenant) {
        // Tenant cancels
        if (booking.status === 'Confirmed' && today >= moveIn) {
          return res.status(400).json({ message: 'Confirmed bookings cannot be cancelled on or after the move-in date.' });
        }
      }

      const updated = await bookingsColl.findByIdAndUpdate(req.params.id, { 
        status: 'Cancelled',
        cancellationReason: cancellationReason || 'No reason provided',
        cancellationDate: new Date().toISOString(),
        cancelledBy: req.user.role,
        updatedAt: new Date().toISOString()
      });

      // Send Notifications
      if (isTenant) {
        // Notify owner
        await notificationsColl.create({
          userId: booking.ownerId,
          title: 'Booking Cancelled by Tenant',
          message: `Tenant ${booking.tenantName} cancelled their booking for "${booking.propertyTitle}". Reason: ${cancellationReason || 'None'}`,
          type: 'warning',
          isRead: false,
          createdAt: new Date().toISOString()
        });
        // Notify tenant
        await notificationsColl.create({
          userId: booking.tenantId,
          title: 'Booking Cancelled',
          message: `You cancelled your booking request for "${booking.propertyTitle}".`,
          type: 'info',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      } else {
        // Owner or Admin cancels
        // Notify tenant
        await notificationsColl.create({
          userId: booking.tenantId,
          title: 'Booking Cancelled by Landlord',
          message: `Your booking for "${booking.propertyTitle}" was cancelled by the landlord. Reason: ${cancellationReason || 'None'}`,
          type: 'error',
          isRead: false,
          createdAt: new Date().toISOString()
        });
        // Notify owner
        await notificationsColl.create({
          userId: booking.ownerId,
          title: 'Booking Cancelled',
          message: `You cancelled the booking for "${booking.propertyTitle}". Reason: ${cancellationReason || 'None'}`,
          type: 'info',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }

      return res.json({ message: 'Booking successfully cancelled.', booking: updated });
    }

    if (status === 'Completed') {
      // Completed after stay
      const updated = await bookingsColl.findByIdAndUpdate(req.params.id, { 
        status: 'Completed',
        updatedAt: new Date().toISOString()
      });

      // Notify Tenant and Owner
      await notificationsColl.create({
        userId: booking.tenantId,
        title: 'Booking Stay Completed',
        message: `Your booking stay at "${booking.propertyTitle}" has been marked as Completed. Thank you for choosing MeroKotha!`,
        type: 'success',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      return res.json({ message: 'Booking status set to Completed.', booking: updated });
    }

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
