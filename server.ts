import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase (requires environment variables)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('Supabase environment variables missing. Supabase functionality disabled.');
}

const app = express();
app.use(express.json());

// Security: Simple AES-256-GCM Encryption
const ALGORITHM = 'aes-256-gcm';
// In a real application, this should be fetched from a secure environment variable
const ENCRYPTION_KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'my-secret-key', 'salt', 32);
const IV_LENGTH = 12;

export function encryptBiometricTemplate(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

// Logging utility
async function logEvent(tenantId: string, event: string) {
  if (!supabase) return;
  const { error } = await supabase.from('logs').insert({
    tenant_id: tenantId,
    event,
    timestamp: new Date().toISOString()
  });
  if (error) console.error('Error logging event:', error);
}

// Decision Logic and Auth Middleware
app.post('/api/validate-point', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');
  
  try {
    const token = authHeader.split('Bearer ')[1];
    
    // Verify token with Supabase
    if (!supabase) return res.status(503).send('Service Unavailable');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      await logEvent('unknown', 'Unauthorized access attempt');
      return res.status(401).send('Unauthorized');
    }
    
    // Logic: Validate tenantId
    const { tenantId, collaboratorId, lat, lng, establishment } = req.body;
    
    // Assuming user metadata contains tenantId
    if (user.user_metadata.tenantId !== tenantId) {
      await logEvent(user.user_metadata.tenantId, `Forbidden access attempt to tenant ${tenantId}`);
      return res.status(403).send('Forbidden');
    }

    // Logic: Validate Radius
    const distance = calculateDistanceMeters(lat, lng, establishment.latitude, establishment.longitude);
    if (distance > establishment.cercaRaioMetros && establishment.bloquearForaDoRaio) {
        await logEvent(tenantId, `Point rejected: Outside geofence for ${collaboratorId}`);
        return res.status(403).json({ valid: false, reason: 'Outside geofence' });
    }

    // Logic: Precedence check (placeholder)
    // Here we would check if a point already exists for this period, etc.
    
    await logEvent(tenantId, `Point validation successful for collaborator ${collaboratorId}`);
    res.json({ valid: true });
  } catch (error) {
    await logEvent('error', `Server error: ${error}`);
    res.status(503).send('Service Unavailable');
  }
});

// Helper: Calculate distance
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const rad1 = (lat1 * Math.PI) / 180;
  const rad2 = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(rad1) * Math.cos(rad2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Store encrypted biometric template
app.post('/api/save-biometric', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');
  
  try {
    const token = authHeader.split('Bearer ')[1];
    if (!supabase) return res.status(503).send('Service Unavailable');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).send('Unauthorized');
    
    const { collaboratorId, encryptedTemplate, tenantId } = req.body;
    
    // Authorization
    if (user.user_metadata.tenantId !== tenantId) return res.status(403).send('Forbidden');
    
    // Save to database
    const { error: dbError } = await supabase.from('collaborators')
      .update({ biometric_template: encryptedTemplate })
      .eq('collaborator_id', collaboratorId);
      
    if (dbError) throw dbError;
    
    await logEvent(tenantId, `Biometric template updated for collaborator ${collaboratorId}`);
    res.json({ success: true });
  } catch (error) {
    await logEvent('error', `Save biometric error: ${error}`);
    res.status(500).send('Internal Server Error');
  }
});

// Vite Middleware
async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
  app.listen(3000, () => console.log('Server running on port 3000'));
}
startServer();
