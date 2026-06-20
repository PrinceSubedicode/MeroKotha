import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import authRoutes from './server/routes/auth.js';
import propertyRoutes from './server/routes/properties.js';
import inquiryRoutes from './server/routes/inquiries.js';
import adminRoutes from './server/routes/admin.js';
import { testMongoConnection } from './server/db.js';
import { applySecurityHeaders, createRateLimiter } from './server/middleware/security.js';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  await testMongoConnection();

  const uploadsDir = path.resolve('./uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(applySecurityHeaders);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  app.use('/uploads', express.static(uploadsDir));

  app.use('/api/auth', createRateLimiter({ windowMs: 15 * 60 * 1000, max: 75 }), authRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/inquiries', inquiryRoutes);
  app.use('/api/admin', adminRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });

    app.use(vite.middlewares);
    console.log(`[MeroKotha] Mounted Vite Dev Middleware on port ${PORT}`);
  } else {
    const distPath = path.resolve('./dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[MeroKotha] Serving compiled production build from ./dist');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MeroKotha Server] Listening on http://0.0.0.0:${PORT}`);

    if (process.env.NODE_ENV !== 'production' && process.env.AUTO_OPEN_BROWSER === 'true') {
      const url = `http://localhost:${PORT}`;
      const command = process.platform === 'win32'
        ? `start ${url}`
        : process.platform === 'darwin'
        ? `open ${url}`
        : `xdg-open ${url}`;

      exec(command, (error) => {
        if (error) {
          console.log(`[MeroKotha Server] Browser did not open automatically. Please visit ${url} manually.`);
        }
      });
    }
  });
}

startServer().catch(err => {
  console.error('[MeroKotha Server] Initialization Failed:', err);
});
