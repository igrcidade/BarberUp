import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import fs from 'fs';

const fbConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

admin.initializeApp({ projectId: fbConfig.projectId });

const db = getFirestore(undefined, fbConfig.firestoreDatabaseId);

async function test() {
  try {
    const s = await db.collection('users').limit(1).get();
    console.log('Success, found users:', s.size);
  } catch(e) {
    console.error('Error:', e.message);
  }
}

test();
