import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let db;
try {
  const fbConfigPath = path.resolve(__dirname, 'firebase-applet-config.json');
  let fbConfig = null;
  if (fs.existsSync(fbConfigPath)) {
    fbConfig = JSON.parse(fs.readFileSync(fbConfigPath, 'utf8'));
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else if (fbConfig) {
    admin.initializeApp({ projectId: fbConfig.projectId });
  } else if (process.env.VITE_FIREBASE_PROJECT_ID) {
    admin.initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID });
  } else {
    admin.initializeApp();
  }
  
  if (fbConfig && fbConfig.firestoreDatabaseId) {
    db = getFirestore(admin.app(), fbConfig.firestoreDatabaseId);
  } else {
    db = getFirestore();
  }

  console.log('✅ Firebase Admin initialized, db exists:', !!db, 'db.collection exists:', !!db?.collection);
} catch (error) {
  console.error('❌ Firebase Admin init error:', error);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// Need raw body for stripe/webhook if any, but regular json for everything else
app.use(express.json());

// Init MercadoPago
const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.VITE_MERCADOPAGO_ACCESS_TOKEN;
if (mpToken) {
  var client = new MercadoPagoConfig({ accessToken: mpToken });
} else {
  console.warn('⚠️ MERCADOPAGO_ACCESS_TOKEN is not defined');
}

app.post('/api/create-checkout', async (req, res) => {
  try {
    const { title, price, userId, email, planType, returnUrl } = req.body;
    
    if (!client) {
      return res.status(500).json({ error: 'MercadoPago is not configured' });
    }

    const appUrl = returnUrl || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: planType,
            title: title,
            quantity: 1,
            unit_price: Number(price),
            currency_id: "BRL"
          }
        ],
        payer: {
          email: email
        },
        external_reference: userId,
        metadata: {
          user_id: userId,
          plan_type: planType
        },
        back_urls: {
          success: `${appUrl}/checkout/success`,
          failure: `${appUrl}/app/subscription`,
          pending: `${appUrl}/checkout/pending`,
        },
        auto_return: "approved",
        statement_descriptor: "BARBERUP"
      }
    });

    res.json({ id: result.id, init_point: result.init_point });
  } catch (error) {
    console.error('Error creating MercadoPago preference:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Admin Reset Password endpoint
app.post('/api/admin/reset-password', async (req, res) => {
  try {
    const { email, newPassword, adminEmail } = req.body;
    
    // Simplistic auth check for the endpoint
    if (!adminEmail || (adminEmail.toLowerCase() !== 'igor.cidade@hotmail.com' && adminEmail.toLowerCase() !== 'igrcidade@gmail.com')) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, {
      password: newPassword
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin Delete User endpoint
app.post('/api/admin/delete-user', async (req, res) => {
  try {
    const { userId, email, adminEmail } = req.body;
    
    if (!adminEmail || (adminEmail.toLowerCase() !== 'igor.cidade@hotmail.com' && adminEmail.toLowerCase() !== 'igrcidade@gmail.com')) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    try {
      // 1. Delete user from Firebase Auth
      await admin.auth().deleteUser(userId);
    } catch (e) {
      if (e.code !== 'auth/user-not-found') {
        console.warn('Could not delete user from Firebase Auth. Proceeding to delete from Firestore. Error:', e.message);
      }
    }

    // 2. Delete user document from Firestore
    await db.collection('users').doc(userId).delete();
    
    // 3. Delete user data across collections
    const collectionsToClean = ['profiles', 'services', 'products', 'clients', 'sales', 'expenses', 'barbers'];
    for (const coll of collectionsToClean) {
      const snapshot = await db.collection(coll).where('userId', '==', userId).get();
      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// MercadoPago Webhook
app.post('/api/webhooks/mercadopago', async (req, res) => {
  try {
    console.log('Webhook Received body:', req.body, 'query:', req.query);
    
    let paymentId = req.body?.data?.id;
    let type = req.body?.type;
    
    if (!paymentId && req.query.id) {
       paymentId = req.query.id;
    }
    if (!type && req.query.topic) {
       type = req.query.topic;
    }

    if (type === 'payment' && paymentId) {
       if (client) {
         try {
           const payment = new Payment(client);
           const paymentData = await payment.get({ id: paymentId });
           
           if (paymentData && paymentData.status === 'approved') {
             const userId = paymentData.metadata?.user_id || paymentData.external_reference;
             const planType = paymentData.metadata?.plan_type;
             
             if (userId) {
                const addDays = (date, days) => {
                  const result = new Date(date);
                  result.setDate(result.getDate() + days);
                  return result;
                };
                
                let daysToAdd = 30;
                if (planType === 'mensal') daysToAdd = 30;
                if (planType === 'semestral') daysToAdd = 180;
                if (planType === 'anual') daysToAdd = 365;

                const newEnd = addDays(new Date(), daysToAdd);

                await db.collection('users').doc(userId).update({
                  subscriptionStatus: 'active',
                  subscriptionPlan: planType || 'mensal',
                  subscriptionEnd: newEnd.toISOString()
                });
                console.log(`User ${userId} subscription updated to active until ${newEnd.toISOString()}`);
             }
           }
         } catch(paymentErr) {
           console.error('Error fetching payment:', paymentErr);
         }
       }
       // MP expects 200/201
       res.status(200).send('OK');
    } else {
       res.status(200).send('OK');
    }
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Webhook Error' });
  }
});

// Vite Middleware
if (process.env.NODE_ENV !== 'production') {
  import('vite').then(({ createServer: createViteServer }) => {
    createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    }).then(vite => {
      app.use(vite.middlewares);
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Development Server running on port ${PORT}`);
      });
    });
  });
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Production Server running on port ${PORT}`);
  });
}
