import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs';
import authRoutes from './server/routes/auth.js';
import propertyRoutes from './server/routes/properties.js';
import inquiryRoutes from './server/routes/inquiries.js';
import adminRoutes from './server/routes/admin.js';
import bookingRoutes from './server/routes/bookings.js';
import notificationRoutes from './server/routes/notifications.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Make sure upload directory exists
  const UPLOADS_DIR = path.resolve('./uploads');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Handle large base64 payload configurations for image uploads
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Serve property upload pictures statically
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Serve static sample/seed assets if requested, or placeholders
  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/inquiries', inquiryRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/notifications', notificationRoutes);

  // Healthcheck
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Serve web application using Vite in Development, and static build files in Production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[MeroKotha] Mounted Vite Dev Middleware on port 3000');
  } else {
    const distPath = path.resolve('./dist');
    // Serve static frontend assets
    app.use(express.static(distPath));
    // Serve index.html for unknown routes to support React Router SPA navigation
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[MeroKotha] Serving compiled production build from ./dist');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n================================================================`);
    console.log(`[MeroKotha Server] 🚀 Running successfully!`);
    console.log(`🏠 Local Workspace Preview  : http://localhost:${PORT}`);
    console.log(`🔗 Local IP Address Access : http://127.0.0.1:${PORT}`);
    console.log(`================================================================\n`);
  });
}

startServer().catch(err => {
  console.error('[MeroKotha Server] Initialization Failed:', err);
});
