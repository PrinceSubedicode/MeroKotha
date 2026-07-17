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

// Fallback dynamic geocoder for Nepal addresses
function getApproximateCoordinates(province, district, city, location) {
  const searchTerms = [
    location || '',
    city || '',
    district || '',
    province || ''
  ];

  const lookup = {
    'jhamsikhel': { lat: 27.6787, lng: 85.3094 },
    'koteshwor': { lat: 27.6749, lng: 85.3486 },
    'lakeside': { lat: 28.2104, lng: 83.9575 },
    'milanchowk': { lat: 27.6976, lng: 83.4542 },
    'durbar area': { lat: 27.6722, lng: 85.4278 },
    'kathmandu': { lat: 27.7172, lng: 85.3240 },
    'lalitpur': { lat: 27.6710, lng: 85.3240 },
    'bhaktapur': { lat: 27.6722, lng: 85.4278 },
    'pokhara': { lat: 28.2096, lng: 83.9856 },
    'butwal': { lat: 27.6876, lng: 83.4486 },
    'dharan': { lat: 26.8125, lng: 87.2835 },
    'biratnagar': { lat: 26.4525, lng: 87.2718 },
    'nepalgunj': { lat: 28.0500, lng: 81.6167 },
    'chitwan': { lat: 27.6833, lng: 84.4333 },
    'bharatpur': { lat: 27.6833, lng: 84.4333 },
    'kaski': { lat: 28.2096, lng: 83.9856 },
    'rupandehi': { lat: 27.6876, lng: 83.4486 },
    'sunsari': { lat: 26.8125, lng: 87.2835 },
    'morang': { lat: 26.4525, lng: 87.2718 },
    'hetauda': { lat: 27.4262, lng: 85.0322 },
    'janakpur': { lat: 26.7275, lng: 85.9225 },
    'birgunj': { lat: 27.0131, lng: 84.8725 },
    'birendranagar': { lat: 28.5912, lng: 81.6247 },
    'surkhet': { lat: 28.5912, lng: 81.6247 },
    'dhangadhi': { lat: 28.6853, lng: 80.6214 },
    'mahendranagar': { lat: 28.9667, lng: 80.1833 },
    'itahari': { lat: 26.6650, lng: 87.2740 },
    'damak': { lat: 26.6667, lng: 87.6833 },
    'birtamode': { lat: 26.6333, lng: 87.9833 },
    'bagmati province': { lat: 27.7172, lng: 85.3240 },
    'gandaki province': { lat: 28.2096, lng: 83.9856 },
    'lumbini province': { lat: 27.6876, lng: 83.4486 },
    'koshi province': { lat: 26.4525, lng: 87.2718 },
    'madhesh province': { lat: 26.7275, lng: 85.9225 },
    'karnali province': { lat: 28.5912, lng: 81.6247 },
    'sudurpashchim province': { lat: 28.6853, lng: 80.6214 }
  };

  for (const term of searchTerms) {
    if (!term) continue;
    const cleanTerm = term.toLowerCase().trim();
    for (const key of Object.keys(lookup)) {
      if (cleanTerm.includes(key) || key.includes(cleanTerm)) {
        return lookup[key];
      }
    }
  }

  return { lat: 27.7172, lng: 85.3240 };
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
        let lat = p.lat;
        let lng = p.lng;
        if (lat === undefined || lat === null || lng === undefined || lng === null) {
          const approx = getApproximateCoordinates(p.province, p.district, p.city, p.location);
          lat = approx.lat;
          lng = approx.lng;
        }
        return {
          ...p,
          lat,
          lng,
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

    // Resolve Confirmed Bookings for availability checking
    const bookingsColl = db.collection('bookings');
    const confirmedBookings = await bookingsColl.find({ propertyId: property._id, status: 'Confirmed' });

    let lat = property.lat;
    let lng = property.lng;
    if (lat === undefined || lat === null || lng === undefined || lng === null) {
      const approx = getApproximateCoordinates(property.province, property.district, property.city, property.location);
      lat = approx.lat;
      lng = approx.lng;
    }

    res.json({
      ...property,
      lat,
      lng,
      ownerInfo: owner ? {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        isVerified: owner.isVerified,
        photo: owner.photo || null
      } : null,
      confirmedBookings: confirmedBookings || []
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

    // Validate coordinates
    if (lat === undefined || lat === null || lat === '' || lng === undefined || lng === null || lng === '') {
      return res.status(400).json({ message: 'Latitude and Longitude are required. Please select a location on the interactive map.' });
    }

    const numLat = Number(lat);
    const numLng = Number(lng);
    if (isNaN(numLat) || isNaN(numLng)) {
      return res.status(400).json({ message: 'Coordinates must be valid numbers.' });
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
      lat: numLat,
      lng: numLng
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

    // Validate coordinates on edit
    if (lat === undefined || lat === null || lat === '' || lng === undefined || lng === null || lng === '') {
      return res.status(400).json({ message: 'Latitude and Longitude are required. Please select a location on the interactive map.' });
    }

    const numLat = Number(lat);
    const numLng = Number(lng);
    if (isNaN(numLat) || isNaN(numLng)) {
      return res.status(400).json({ message: 'Coordinates must be valid numbers.' });
    }

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
    updates.lat = numLat;
    updates.lng = numLng;
    
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

// PUT /api/properties/:id/status: Owner updates property status (Approved/Available, Occupied, Hidden, Archived)
router.put('/:id/status', authenticateToken, authorizeRoles('Property Owner'), async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Approved', 'Occupied', 'Hidden', 'Archived'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status update command.' });
    }

    const propertiesColl = db.collection('properties');
    const property = await propertiesColl.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property listing not found.' });
    }

    if (String(property.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden. You do not own this listing.' });
    }

    const updates = { 
      status,
      isAvailable: status === 'Approved'
    };
    const updated = await propertiesColl.findByIdAndUpdate(req.params.id, updates);

    res.json({
      message: `Property status set to '${status === 'Approved' ? 'Available' : status}' successfully!`,
      property: updated
    });
  } catch (error) {
    console.error('Owner property status change failed:', error);
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
