# MeroKotha

MeroKotha is a modern room, flat, and house rental marketplace for Nepal. Tenants can browse verified listings, save favorites, and send inquiries. Property owners can manage listings and tenant leads. Admins can review users, approve or reject listings, and remove fake properties.

## Tech Stack

- React, Vite, Tailwind CSS
- Node.js, Express.js
- JWT authentication with role-based access control
- MongoDB Atlas through the existing database adapter, with local JSON fallback for demos
- Optional Cloudinary unsigned uploads for property images

## Roles

- Tenant: browse, search, filter, save favorites, send inquiries
- Property Owner: add, edit, delete, and resubmit property listings; view tenant inquiries
- Admin: view analytics, manage users, approve or reject listings, remove fake listings

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from `.env.example` and set at least:

   ```bash
   JWT_SECRET=replace-with-a-long-random-secret
   MONGODB_URI=mongodb+srv://...
   ```

   Leave `MONGODB_URI` empty if you want to run the included local JSON demo data.

3. Run the full-stack dev server:

   ```bash
   npm run dev
   ```

4. Open:

   ```text
   http://localhost:3000
   ```

## Demo Accounts

- Admin: `admin@merokotha.com` / `admin123`
- Owner: `owner@merokotha.com` / `owner123`
- Tenant: `tenant@merokotha.com` / `tenant123`

## Cloudinary Uploads

Local image storage works by default. To upload property images to Cloudinary instead, create an unsigned upload preset and set:

```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
CLOUDINARY_FOLDER=merokotha/properties
```

If Cloudinary fails or is not configured, MeroKotha automatically stores uploaded images in `uploads/`.

## Production

```bash
npm run build
npm run start
```

Set `NODE_ENV=production`, a strong `JWT_SECRET`, and a real `MONGODB_URI` in production. The Express server serves the compiled `dist/` frontend and exposes the REST API under `/api`.
