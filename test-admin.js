import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const fbConfigPath = path.resolve(__dirname, 'firebase-applet-config.json');
  let fbConfig = null;
  if (fs.existsSync(fbConfigPath)) {
    fbConfig = JSON.parse(fs.readFileSync(fbConfigPath, 'utf8'));
  }
  console.log("Found fbConfig:", fbConfig);

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.log("Using env service account");
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else if (fbConfig) {
    console.log("Using fbConfig");
    admin.initializeApp({ projectId: fbConfig.projectId });
  } else if (process.env.VITE_FIREBASE_PROJECT_ID) {
    admin.initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID });
  } else {
    admin.initializeApp();
  }
  
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Firebase Admin init error:', error);
}
