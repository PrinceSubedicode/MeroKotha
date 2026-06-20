import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DATA_DIR = path.resolve('./data');

// Ensure database directory exists for local disk fallback
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// === Local File Storage Engine (Fallback Mode) ===
function readCollection(collectionName) {
  const filePath = path.join(DATA_DIR, `${collectionName}.json`);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(rawData || '[]');
  } catch (error) {
    console.error(`Error reading database file ${collectionName}:`, error);
    return [];
  }
}

function writeCollection(collectionName, data) {
  const filePath = path.join(DATA_DIR, `${collectionName}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing database file ${collectionName}:`, error);
    return false;
  }
}

function matchQuery(item, query) {
  for (const key in query) {
    if (query[key] === undefined) continue;
    const value = query[key];

    if (typeof value === 'object' && value !== null) {
      if ('$gte' in value) {
        if (Number(item[key]) < Number(value['$gte'])) return false;
      }
      if ('$lte' in value) {
        if (Number(item[key]) > Number(value['$lte'])) return false;
      }
      if ('$regex' in value) {
        const regex = new RegExp(value['$regex'], 'i');
        if (!regex.test(String(item[key] || ''))) return false;
      }
      if ('$in' in value) {
        if (!Array.isArray(value['$in'])) return false;
        if (!value['$in'].includes(item[key])) return false;
      }
    } else {
      if (item[key] !== value) return false;
    }
  }
  return true;
}

// === MongoDB Client Management (Atlas Connection Mode) ===
let mongoClient = null;
let mongoDb = null;
let isConnecting = false;

async function getMongoDb() {
  if (!MONGODB_URI) return null;
  if (mongoDb) return mongoDb;
  
  if (isConnecting) {
    // Keep yielding to let concurrent requests share the same startup promise
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return mongoDb;
  }

  isConnecting = true;
  try {
    console.log('[MeroKotha DB] 🔄 Connecting to MongoDB Atlas cluster...');
    mongoClient = new MongoClient(MONGODB_URI, {
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
    });
    await mongoClient.connect();
    
    // Auto-detect db name from the connection string or fallback to standard name
    mongoDb = mongoClient.db();
    console.log(`[MeroKotha DB] ✅ Success! Connected to database: "${mongoDb.databaseName}"`);
    
    isConnecting = false;
    
    // Safely trigger administrative initial seeds in background
    seedDatabase().catch(err => {
      console.error('[MeroKotha DB] ❌ Background database seeding failed:', err);
    });

    return mongoDb;
  } catch (error) {
    isConnecting = false;
    console.error('[MeroKotha DB] ❌ Connection failed:', error.message);
    console.warn('[MeroKotha DB] ⚠️ Falling back safely to Local JSON Filesystem Storage!');
    return null;
  }
}

// Converts generic JS queries to standard MongoDB format (handling hex string ObjectIds natively)
function toMongoQuery(query) {
  if (!query) return {};
  const converted = {};
  for (const key in query) {
    if (query[key] === undefined) continue;
    const val = query[key];

    if (key === '_id' || key === 'id') {
      if (typeof val === 'string' && val.length === 24 && /^[0-9a-fA-F]{24}$/.test(val)) {
        converted['_id'] = new ObjectId(val);
      } else if (typeof val === 'object' && val !== null && '$in' in val) {
        const mappedIn = val['$in'].map(item => {
          if (typeof item === 'string' && item.length === 24 && /^[0-9a-fA-F]{24}$/.test(item)) {
            return new ObjectId(item);
          }
          return item;
        });
        converted['_id'] = { $in: mappedIn };
      } else {
        converted['_id'] = val;
      }
    } else if (typeof val === 'object' && val !== null) {
      const opConverted = {};
      for (const op in val) {
        if (op === '$regex') {
          opConverted[op] = val[op];
          if (!('$options' in val)) {
            opConverted['$options'] = 'i';
          }
        } else {
          opConverted[op] = val[op];
        }
      }
      converted[key] = opConverted;
    } else {
      // Map properties matching ObjectId values to raw string or ID reference
      if (typeof val === 'string' && val.length === 24 && /^[0-9a-fA-F]{24}$/.test(val) && (key === 'owner' || key === 'propertyId' || key === 'tenantId' || key === 'ownerId')) {
        // Try searching either as ObjectId or standard string key to sustain compatibility
        converted[key] = { $in: [val, new ObjectId(val)] };
      } else {
        converted[key] = val;
      }
    }
  }
  return converted;
}

// Normalizes document elements to prevent type complaints on the front-end (converts BSON objects to string representation)
function fromMongoDoc(doc) {
  if (!doc) return null;
  const result = { ...doc };
  if (result._id instanceof ObjectId) {
    result._id = result._id.toString();
  }
  // Convert any sub-documents and IDs recursively
  for (const key in result) {
    if (result[key] instanceof ObjectId) {
      result[key] = result[key].toString();
    } else if (Array.isArray(result[key])) {
      result[key] = result[key].map(item => (item instanceof ObjectId ? item.toString() : item));
    }
  }
  return result;
}

// === Test MongoDB Connection on Startup ===
export async function testMongoConnection() {
  if (!MONGODB_URI) {
    console.log('[MeroKotha DB] ⚠️  No MongoDB URI configured - using local JSON storage');
    return false;
  }
  
  try {
    console.log('[MeroKotha DB] 🔄 Testing MongoDB Atlas connection...');
    const db = await getMongoDb();
    if (db) {
      console.log(`[MeroKotha DB] ✅ MongoDB connection successful!`);
      return true;
    } else {
      console.log('[MeroKotha DB] ⚠️  MongoDB connection failed, using local JSON storage as fallback');
      return false;
    }
  } catch (error) {
    console.error('[MeroKotha DB] ❌ MongoDB connection test error:', error.message);
    return false;
  }
}

export const db = {
  collection(name) {
    return {
      find: async (query = {}) => {
        const activeMongo = await getMongoDb();
        if (activeMongo) {
          const mongoQuery = toMongoQuery(query);
          const docs = await activeMongo.collection(name).find(mongoQuery).toArray();
          return docs.map(fromMongoDoc);
        } else {
          const list = readCollection(name);
          return list.filter(item => matchQuery(item, query));
        }
      },

      findOne: async (query = {}) => {
        const activeMongo = await getMongoDb();
        if (activeMongo) {
          const mongoQuery = toMongoQuery(query);
          const doc = await activeMongo.collection(name).findOne(mongoQuery);
          return fromMongoDoc(doc);
        } else {
          const list = readCollection(name);
          return list.find(item => matchQuery(item, query)) || null;
        }
      },

      findById: async (id) => {
        const activeMongo = await getMongoDb();
        if (activeMongo) {
          if (typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
            const doc = await activeMongo.collection(name).findOne({ _id: new ObjectId(id) });
            return fromMongoDoc(doc);
          } else {
            const doc = await activeMongo.collection(name).findOne({ _id: id });
            return fromMongoDoc(doc);
          }
        } else {
          const list = readCollection(name);
          return list.find(item => String(item._id) === String(id)) || null;
        }
      },

      create: async (doc) => {
        const activeMongo = await getMongoDb();
        if (activeMongo) {
          const docToSave = { ...doc };
          // Translate string attributes that look like 24-character hex fields back into ObjectId references
          if (docToSave._id && typeof docToSave._id === 'string' && docToSave._id.length === 24 && /^[0-9a-fA-F]{24}$/.test(docToSave._id)) {
            docToSave._id = new ObjectId(docToSave._id);
          }
          if (docToSave.owner && typeof docToSave.owner === 'string' && docToSave.owner.length === 24 && /^[0-9a-fA-F]{24}$/.test(docToSave.owner)) {
            docToSave.owner = new ObjectId(docToSave.owner);
          }
          if (docToSave.propertyId && typeof docToSave.propertyId === 'string' && docToSave.propertyId.length === 24 && /^[0-9a-fA-F]{24}$/.test(docToSave.propertyId)) {
            docToSave.propertyId = new ObjectId(docToSave.propertyId);
          }
          if (docToSave.tenantId && typeof docToSave.tenantId === 'string' && docToSave.tenantId.length === 24 && /^[0-9a-fA-F]{24}$/.test(docToSave.tenantId)) {
            docToSave.tenantId = new ObjectId(docToSave.tenantId);
          }
          if (docToSave.ownerId && typeof docToSave.ownerId === 'string' && docToSave.ownerId.length === 24 && /^[0-9a-fA-F]{24}$/.test(docToSave.ownerId)) {
            docToSave.ownerId = new ObjectId(docToSave.ownerId);
          }
          
          docToSave.createdAt = docToSave.createdAt || new Date().toISOString();
          
          const result = await activeMongo.collection(name).insertOne(docToSave);
          const saved = await activeMongo.collection(name).findOne({ _id: result.insertedId });
          return fromMongoDoc(saved);
        } else {
          const list = readCollection(name);
          const newDoc = {
            _id: Math.random().toString(36).substring(2, 11),
            createdAt: new Date().toISOString(),
            ...doc
          };
          list.push(newDoc);
          writeCollection(name, list);
          return newDoc;
        }
      },

      findByIdAndUpdate: async (id, updateFields) => {
        const activeMongo = await getMongoDb();
        if (activeMongo) {
          const _id = (typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) ? new ObjectId(id) : id;
          
          const fieldsToUpdate = { ...updateFields };
          delete fieldsToUpdate._id; // Ensure immutable identifier remains untouched
          fieldsToUpdate.updatedAt = new Date().toISOString();

          // Translate nested referenced elements:
          if (fieldsToUpdate.owner && typeof fieldsToUpdate.owner === 'string' && fieldsToUpdate.owner.length === 24 && /^[0-9a-fA-F]{24}$/.test(fieldsToUpdate.owner)) {
            fieldsToUpdate.owner = new ObjectId(fieldsToUpdate.owner);
          }
          if (fieldsToUpdate.propertyId && typeof fieldsToUpdate.propertyId === 'string' && fieldsToUpdate.propertyId.length === 24 && /^[0-9a-fA-F]{24}$/.test(fieldsToUpdate.propertyId)) {
            fieldsToUpdate.propertyId = new ObjectId(fieldsToUpdate.propertyId);
          }
          if (fieldsToUpdate.tenantId && typeof fieldsToUpdate.tenantId === 'string' && fieldsToUpdate.tenantId.length === 24 && /^[0-9a-fA-F]{24}$/.test(fieldsToUpdate.tenantId)) {
            fieldsToUpdate.tenantId = new ObjectId(fieldsToUpdate.tenantId);
          }
          if (fieldsToUpdate.ownerId && typeof fieldsToUpdate.ownerId === 'string' && fieldsToUpdate.ownerId.length === 24 && /^[0-9a-fA-F]{24}$/.test(fieldsToUpdate.ownerId)) {
            fieldsToUpdate.ownerId = new ObjectId(fieldsToUpdate.ownerId);
          }

          await activeMongo.collection(name).updateOne(
            { _id },
            { $set: fieldsToUpdate }
          );
          const updated = await activeMongo.collection(name).findOne({ _id });
          return fromMongoDoc(updated);
        } else {
          const list = readCollection(name);
          const index = list.findIndex(item => String(item._id) === String(id));
          if (index === -1) return null;

          const updated = {
            ...list[index],
            ...updateFields,
            updatedAt: new Date().toISOString()
          };
          
          delete updated._id;
          list[index] = { _id: id, ...updated };
          
          writeCollection(name, list);
          return list[index];
        }
      },

      findByIdAndDelete: async (id) => {
        const activeMongo = await getMongoDb();
        if (activeMongo) {
          const _id = (typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) ? new ObjectId(id) : id;
          const result = await activeMongo.collection(name).deleteOne({ _id });
          return result.deletedCount > 0;
        } else {
          let list = readCollection(name);
          const toDelete = list.find(item => String(item._id) === String(id));
          if (!toDelete) return false;
          
          list = list.filter(item => String(item._id) !== String(id));
          writeCollection(name, list);
          return true;
        }
      },

      deleteOne: async (query = {}) => {
        const activeMongo = await getMongoDb();
        if (activeMongo) {
          const mongoQuery = toMongoQuery(query);
          const result = await activeMongo.collection(name).deleteOne(mongoQuery);
          return result.deletedCount > 0;
        } else {
          let list = readCollection(name);
          const index = list.findIndex(item => matchQuery(item, query));
          if (index === -1) return false;

          list.splice(index, 1);
          writeCollection(name, list);
          return true;
        }
      },

      deleteMany: async (query = {}) => {
        const activeMongo = await getMongoDb();
        if (activeMongo) {
          const mongoQuery = toMongoQuery(query);
          const result = await activeMongo.collection(name).deleteMany(mongoQuery);
          return result.deletedCount;
        } else {
          let list = readCollection(name);
          const originalLength = list.length;
          list = list.filter(item => !matchQuery(item, query));
          writeCollection(name, list);
          return originalLength - list.length;
        }
      },

      updateMany: async (query = {}, updateFields = {}) => {
        const activeMongo = await getMongoDb();
        if (activeMongo) {
          const mongoQuery = toMongoQuery(query);
          const fieldsToUpdate = { ...updateFields };
          delete fieldsToUpdate._id;
          fieldsToUpdate.updatedAt = new Date().toISOString();

          // Translate relations:
          if (fieldsToUpdate.owner && typeof fieldsToUpdate.owner === 'string' && fieldsToUpdate.owner.length === 24 && /^[0-9a-fA-F]{24}$/.test(fieldsToUpdate.owner)) {
            fieldsToUpdate.owner = new ObjectId(fieldsToUpdate.owner);
          }

          const result = await activeMongo.collection(name).updateMany(
            mongoQuery,
            { $set: fieldsToUpdate }
          );
          return result.modifiedCount;
        } else {
          const list = readCollection(name);
          let count = 0;
          const updatedList = list.map(item => {
            if (matchQuery(item, query)) {
              count++;
              return { ...item, ...updateFields, updatedAt: new Date().toISOString() };
            }
            return item;
          });
          writeCollection(name, updatedList);
          return count;
        }
      },

      count: async (query = {}) => {
        const activeMongo = await getMongoDb();
        if (activeMongo) {
          const mongoQuery = toMongoQuery(query);
          return await activeMongo.collection(name).countDocuments(mongoQuery);
        } else {
          const list = readCollection(name);
          return list.filter(item => matchQuery(item, query)).length;
        }
      }
    };
  }
};

// Seed initial database state if empty (Works both with MongoDB Atlas cluster and Local Storage!)
export async function seedDatabase() {
  const usersColl = db.collection('users');
  const propertiesColl = db.collection('properties');
  const inquiriesColl = db.collection('inquiries');

  const userCount = await usersColl.count();
  if (userCount === 0) {
    console.log('[MeroKotha DB] 🌱 Database empty. Hydrating schema & seeding default configurations...');
    
    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const ownerPasswordHash = await bcrypt.hash('owner123', 10);
    const tenantPasswordHash = await bcrypt.hash('tenant123', 10);

    // Create seed users
    const adminUser = await usersColl.create({
      name: 'MeroKotha Admin',
      email: 'admin@merokotha.com',
      password: adminPasswordHash,
      role: 'Admin',
      phone: '9801234567',
      favorites: [],
      isVerified: true
    });

    const ownerUser = await usersColl.create({
      name: 'Ramesh Adhikari',
      email: 'owner@merokotha.com',
      password: ownerPasswordHash,
      role: 'Property Owner',
      phone: '9841567890',
      favorites: [],
      isVerified: true
    });

    const tenantUser = await usersColl.create({
      name: 'Sushant Shrestha',
      email: 'tenant@merokotha.com',
      password: tenantPasswordHash,
      role: 'Tenant',
      phone: '9851098765',
      favorites: [],
      isVerified: true
    });

    // Create high-quality seeded properties across Nepal
    const properties = [
      {
        title: 'Modern Cozy Studio Apartment',
        description: 'A beautiful, fully-furnished single bedroom studio apartment at Jhamsikhel, Lalitpur’s most premium neighborhood. Quiet environment, 24/7 solar back-up electricity, continuous water supply, high speed Wi-Fi, and terrace access. Perfect for single professionals or couples looking for a long term state of art living experience.',
        rent: 18000,
        propertyType: 'Room',
        province: 'Bagmati Province',
        district: 'Lalitpur',
        city: 'Lalitpur',
        location: 'Jhamsikhel',
        bedrooms: 1,
        bathrooms: 1,
        facilities: ['Furnished', 'Continuous Water', 'Electricity Backup', 'High-speed internet', 'Parking', 'Terrace Access'],
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800'
        ],
        owner: ownerUser._id,
        status: 'Approved'
      },
      {
        title: 'Spacious 2 BHK Family Flat in Koteshwor',
        description: 'Perfect family ground floor flat in Koteshwor, Kathmandu. Features 2 large bedrooms, 1 common fully tiled bathroom, 1 modular kitchen setup and a spacious living room. Located 5 minutes walking distance from Koteshwor Chowk with safe parking and immediate public transportation access.',
        rent: 26000,
        propertyType: 'Flat',
        province: 'Bagmati Province',
        district: 'Kathmandu',
        city: 'Kathmandu',
        location: 'Koteshwor',
        bedrooms: 2,
        bathrooms: 1,
        facilities: ['Parking', 'Continuous Water', 'CCTV Security', 'Kitchen Utilities', 'Balcony'],
        images: [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800'
        ],
        owner: ownerUser._id,
        status: 'Approved'
      },
      {
        title: 'Beautiful Luxury Homestay Villa near Lakeside',
        description: 'Unmatched 4 BHK luxury home in Lakeside, Pokhara with majestic views of Fewa Lake and the Annapurna Mountain range. Boasts premium architecture, a manicured garden area, a private carport, dynamic living spaces, modular appliances, and supreme design standards. Ideally suited for expats, premium homestays, or large families.',
        rent: 85000,
        propertyType: 'House',
        province: 'Gandaki Province',
        district: 'Kaski',
        city: 'Pokhara',
        location: 'Lakeside Ward 6',
        bedrooms: 4,
        bathrooms: 3,
        facilities: ['Garden', 'Private Garage', 'Scenic Hill View', 'Continuous Water', 'Semi-Furnished', 'AC Rooms', 'Airy Balcony'],
        images: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800'
        ],
        owner: ownerUser._id,
        status: 'Approved'
      },
      {
        title: 'Charming 2 BHK Flat near Lakeside',
        description: 'A wonderful, well-ventilated 2 bedroom apartment located in a serene residential sector near Lakeside, Pokhara. Features continuous water supply with solar heater access, scenic views of the hills, high-speed Wi-Fi, and open bike parking. Highly recommended for couples or students.',
        rent: 14000,
        propertyType: 'Flat',
        province: 'Gandaki Province',
        district: 'Kaski',
        city: 'Pokhara',
        location: 'Lakeside Ward 8',
        bedrooms: 2,
        bathrooms: 1,
        facilities: ['Continuous Water', 'High-speed internet', 'Parking', 'Balcony'],
        images: [
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800'
        ],
        owner: ownerUser._id,
        status: 'Approved'
      },
      {
        title: 'Affordable 1 BHK Flat near Butwal Chowk',
        description: 'Nice and clean first-floor 1 BHK flat for rent. Has 1 bedroom, 1 separate kitchen, and water availability. Located near Milanchowk, Butwal and close to the local schools and markets.',
        rent: 11000,
        propertyType: 'Flat',
        province: 'Lumbini Province',
        district: 'Rupandehi',
        city: 'Butwal',
        location: 'Milanchowk',
        bedrooms: 1,
        bathrooms: 1,
        facilities: ['Continuous Water', 'Bike Parking'],
        images: [
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=800'
        ],
        owner: ownerUser._id,
        status: 'Approved'
      },
      {
        title: 'Pending Cozy Room for Rent - Bhaktapur',
        description: 'This is a test listing showing pending approval behavior. Private room with basic amenities near Bhaktapur Durbar Square. Available exclusively for students or single guests.',
        rent: 6500,
        propertyType: 'Room',
        province: 'Bagmati Province',
        district: 'Bhaktapur',
        city: 'Bhaktapur',
        location: 'Durbar Area',
        bedrooms: 1,
        bathrooms: 1,
        facilities: ['Electric Back-up', 'Bike Parking'],
        images: [
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=800'
        ],
        owner: ownerUser._id,
        status: 'Pending'
      }
    ];

    for (const prop of properties) {
      const addedProp = await propertiesColl.create(prop);
      
      // Seed a test inquiry for the first property
      if (prop.title === 'Modern Cozy Studio Apartment') {
        await inquiriesColl.create({
          propertyId: addedProp._id,
          propertyTitle: addedProp.title,
          ownerId: addedProp.owner,
          tenantId: tenantUser._id,
          tenantName: tenantUser.name,
          tenantEmail: tenantUser.email,
          tenantPhone: tenantUser.phone,
          message: 'Hello, I am interested in renting this cozy studio in Jhamsikhel. Is it still available for inspection this Saturday?',
          status: 'Pending'
        });
      }
    }
    console.log('[MeroKotha DB] ✅ Seeding complete!');
  }
}

// Initial seeding if running local disk-db fallback
if (!MONGODB_URI) {
  seedDatabase().catch(err => {
    console.error('[MeroKotha DB] Local Database seeding failed:', err);
  });
}
