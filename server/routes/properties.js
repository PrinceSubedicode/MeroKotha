import express from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

const UPLOADS_DIR = path.resolve('./uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Utility to process and save base64 uploaded images locally
function saveImage(base64String) {
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
    const fileName = `prop_${Date.now()}_${randomSuffix}.${fileExtension}`;
    const targetPath = path.join(UPLOADS_DIR, fileName);
    
    fs.writeFileSync(targetPath, imageBuffer);
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error('Failed to save listing image locally:', error);
    return base64String;
  }
}

// GET /api/properties: Retrieve approved properties matching public search filters
router.get('/', async (req, res) => {
  try {
    const { city, district, propertyType, minRent, maxRent, bedrooms, search } = req.query;

    const propertiesColl = db.collection('properties');
    let properties = await propertiesColl.find({ status: 'Approved' });

    // Filter by city (case insensitive match)
    if (city) {
      properties = properties.filter(p => p.city && p.city.toLowerCase() === city.toLowerCase());
    }

    // Filter by district (case insensitive match)
    if (district) {
      properties = properties.filter(p => p.district && p.district.toLowerCase() === district.toLowerCase());
    }

    // Filter by propertyType (Room, Flat, House)
    if (propertyType) {
      properties = properties.filter(p => p.propertyType && p.propertyType.toLowerCase() === propertyType.toLowerCase());
    }

    // Filter by rent range
    if (minRent) {
      properties = properties.filter(p => Number(p.rent) >= Number(minRent));
    }
    if (maxRent) {
      properties = properties.filter(p => Number(p.rent) <= Number(maxRent));
    }

    // Filter by bedrooms
    if (bedrooms && bedrooms !== 'any') {
      if (String(bedrooms).endsWith('+')) {
        const minBeds = parseInt(bedrooms, 10);
        if (!isNaN(minBeds)) {
          properties = properties.filter(p => Number(p.bedrooms) >= minBeds);
        }
      } else {
        properties = properties.filter(p => Number(p.bedrooms) === Number(bedrooms));
      }
    }

    // Keyword Search (searches title, description, city, district, location)
    if (search) {
      const keyword = search.toLowerCase();
      properties = properties.filter(p => 
        (p.title && p.title.toLowerCase().includes(keyword)) ||
        (p.description && p.description.toLowerCase().includes(keyword)) ||
        (p.city && p.city.toLowerCase().includes(keyword)) ||
        (p.district && p.district.toLowerCase().includes(keyword)) ||
        (p.location && p.location.toLowerCase().includes(keyword))
      );
    }

    // Resolve owner information summaries (no password!)
    const usersColl = db.collection('users');
    const resolvedProperties = await Promise.all(
      properties.map(async (p) => {
        const ownerInfo = await usersColl.findById(p.owner);
        return {
          ...p,
          ownerInfo: ownerInfo ? { name: ownerInfo.name, phone: ownerInfo.phone, email: ownerInfo.email } : null
        };
      })
    );

    // Dynamic sort by newest created
    resolvedProperties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(resolvedProperties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Internal server error while searching.' });
  }
});

// GET /api/properties/my-listings: Retrieve owner's owned properties
router.get('/my-listings', authenticateToken, authorizeRoles('Property Owner'), async (req, res) => {
  try {
    const propertiesColl = db.collection('properties');
    const myProperties = await propertiesColl.find({ owner: req.user._id });

    // Sort by newest
    myProperties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(myProperties);
  } catch (error) {
    console.error('Failed fetching owner listings:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/properties/:id: Retrieve full property details (including owner contact)
router.get('/:id', async (req, res) => {
  try {
    const propertiesColl = db.collection('properties');
    const property = await propertiesColl.findById(req.id || req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    // Resolve Owner Info
    const usersColl = db.collection('users');
    const owner = await usersColl.findById(property.owner);

    res.json({
      ...property,
      ownerInfo: owner ? {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        isVerified: owner.isVerified,
        photo: owner.photo || null
      } : null
    });
  } catch (error) {
    console.error('Error fetching property details:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/properties: Owner adds a new listing
router.post('/', authenticateToken, authorizeRoles('Property Owner'), async (req, res) => {
  try {
    const { 
      title, description, rent, propertyType, 
      province, district, city, location, 
      bedrooms, bathrooms, facilities = [], images = [],
      lat, lng
    } = req.body;

    // Validate inputs
    if (!title || !description || !rent || !propertyType || !province || !district || !city || !location) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    // Process uploaded base64 strings
    const processedImages = (images || []).map(img => saveImage(img));
    
    // Default image if none provided
    if (processedImages.length === 0) {
      processedImages.push('https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800');
    }

    const propertiesColl = db.collection('properties');
    const newProperty = await propertiesColl.create({
      title,
      description,
      rent: Number(rent),
      propertyType,
      province,
      district,
      city,
      location,
      bedrooms: Number(bedrooms || 1),
      bathrooms: Number(bathrooms || 1),
      facilities,
      images: processedImages,
      owner: req.user._id,
      status: 'Pending', // Requires admin verification
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null
    });

    res.status(201).json({
      message: 'Property listing submitted successfully! Pending admin approval.',
      property: newProperty
    });

  } catch (error) {
    console.error('Listing creation error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/properties/:id: Owner edits property details
router.put('/:id', authenticateToken, authorizeRoles('Property Owner'), async (req, res) => {
  try {
    const propertiesColl = db.collection('properties');
    const propertyToEdit = await propertiesColl.findById(req.params.id);

    if (!propertyToEdit) {
      return res.status(404).json({ message: 'Property listing not found.' });
    }

    // Verification that user is the owner
    if (String(propertyToEdit.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden. You do not own this listing.' });
    }

    const { 
      title, description, rent, propertyType, 
      province, district, city, location, 
      bedrooms, bathrooms, facilities, images,
      lat, lng
    } = req.body;

    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (rent) updates.rent = Number(rent);
    if (propertyType) updates.propertyType = propertyType;
    if (province) updates.province = province;
    if (district) updates.district = district;
    if (city) updates.city = city;
    if (location) updates.location = location;
    if (bedrooms) updates.bedrooms = Number(bedrooms);
    if (bathrooms) updates.bathrooms = Number(bathrooms);
    if (facilities) updates.facilities = facilities;
    if (lat !== undefined) updates.lat = lat ? Number(lat) : null;
    if (lng !== undefined) updates.lng = lng ? Number(lng) : null;
    
    if (images) {
      updates.images = images.map(img => saveImage(img));
    }

    // Editing sets it back to 'Pending' for review
    updates.status = 'Pending';

    const updated = await propertiesColl.findByIdAndUpdate(req.params.id, updates);

    res.json({
      message: 'Listing updated successfully! Submitted for re-approval.',
      property: updated
    });
  } catch (error) {
    console.error('Failed to update listing:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/properties/:id: Owner deletes property details
router.delete('/:id', authenticateToken, authorizeRoles('Property Owner', 'Admin'), async (req, res) => {
  try {
    const propertiesColl = db.collection('properties');
    const propertyToDelete = await propertiesColl.findById(req.params.id);

    if (!propertyToDelete) {
      return res.status(404).json({ message: 'Property listing not found.' });
    }

    // Authenticate owner or admin
    if (req.user.role !== 'Admin' && String(propertyToDelete.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission.' });
    }

    // Delete associated inquiries
    const inquiriesColl = db.collection('inquiries');
    await inquiriesColl.deleteMany({ propertyId: req.params.id });

    // Delete property
    await propertiesColl.findByIdAndDelete(req.params.id);

    res.json({ message: 'Property listing and associated inquiries successfully deleted!' });
  } catch (error) {
    console.error('Listing deletion error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
