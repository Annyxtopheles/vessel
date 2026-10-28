import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

// Local-First Git Vault Sync Plugin (Path A: writes directly to src/data/vessel_vault.json on disk)
function vaultSyncPlugin() {
  const vaultPath = path.resolve(import.meta.dirname || process.cwd(), 'src/data/vessel_vault.json');

  return {
    name: 'vault-sync-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url === '/api/vault' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          if (fs.existsSync(vaultPath)) {
            const data = fs.readFileSync(vaultPath, 'utf-8');
            res.end(data);
          } else {
            res.end(JSON.stringify({ exists: false }));
          }
          return;
        }

        if (req.url === '/api/vault' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              fs.writeFileSync(vaultPath, JSON.stringify(parsed, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, savedAt: new Date().toISOString() }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to write vault data' }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    vaultSyncPlugin(),
  ],
});
