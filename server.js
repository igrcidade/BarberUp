import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let db;
let adminError = null;
try {
  const fbConfigPath = path.resolve(__dirname, 'firebase-applet-config.json');
  let fbConfig = null;
  if (fs.existsSync(fbConfigPath)) {
    fbConfig = JSON.parse(fs.readFileSync(fbConfigPath, 'utf8'));
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      let keyString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      
      // Attempt to fix common Hostinger escaping issues:
      // Remove escaping from braces and quotes if present
      keyString = keyString.replace(/\\{/g, '{').replace(/\\}/g, '}');
      
      // If it's wrapped in single quotes, remove them
      if (keyString.startsWith("'") && keyString.endsWith("'")) {
        keyString = keyString.slice(1, -1);
      }

      // Find the JSON block
      const startIdx = keyString.indexOf('{');
      const endIdx = keyString.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        keyString = keyString.substring(startIdx, endIdx + 1);
      }

      // Try to unescape double quotes if they were escaped like \"
      // But avoid messing up \\n inside private_key by doing a quick test
      try {
        JSON.parse(keyString);
      } catch (e) {
        if (keyString.includes('\\"')) {
          keyString = keyString.replace(/\\"/g, '"');
        }
      }

      let serviceAccount;
      try {
        serviceAccount = JSON.parse(keyString);
      } catch (parseErr) {
        // As a last ditch effort, try to run it via Function to parse JS object string
        serviceAccount = new Function('return ' + keyString)();
      }

      // Fix newline issues inside the private key
      if (serviceAccount && serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (parseError) {
      throw new Error(`Erro ao interpretar FIREBASE_SERVICE_ACCOUNT_KEY (deve ser um JSON válido). Erro: ${parseError.message}`);
    }
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
  adminError = error.message;
  console.error('❌ Firebase Admin init error:', error);
}

const app = express();
app.get('/api/admin-status', (req, res) => {
  res.json({ error: adminError, appNames: admin.apps.map(a => a?.name) });
});
const PORT = process.env.PORT || 3000;

// Nodemailer setup
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'contato@usebarberup.com',
    pass: process.env.SMTP_PASSWORD // Configurar esta variável no Hostinger
  }
});


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
        payment_methods: {
          excluded_payment_methods: [
            { id: "pix" }
          ]
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

// Request Password Reset via Nodemailer
app.post('/api/create-password-reset-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    if (!admin.apps.length) {
      return res.status(500).json({ success: false, error: `SDK Admin não configurado: ${adminError || 'Variável FIREBASE_SERVICE_ACCOUNT_KEY ausente ou inválida'}.` });
    }

    let link;
    try {
      link = await admin.auth().generatePasswordResetLink(email);
    } catch (authError) {
      console.error("Admin Auth Error:", authError);
      return res.status(500).json({ 
        success: false, 
        error: `Erro ao gerar link de recuperação no Firebase. Verifique se a variável FIREBASE_SERVICE_ACCOUNT_KEY contém um JSON de 'Conta de Serviço' válido com as permissões corretas. (Erro: ${authError.message})`
      });
    }

    // Send email via nodemailer
    await transporter.sendMail({
      from: '"BarberUp" <contato@usebarberup.com>',
      to: email,
      subject: 'Redefinição de Senha - BarberUp',
      html: `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #f97316;">Recuperação de Acesso</h2>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta BarberUp.</p>
          <p>Para criar uma nova senha, clique no botão abaixo:</p>
          <p style="margin: 30px 0;">
            <a href="${link}" style="display: inline-block; background-color: #f97316; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px;">Redefinir Senha</a>
          </p>
          <p>Se você não solicitou esta alteração, pode ignorar este e-mail.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="font-size: 14px; color: #666; text-align: center;">Um grande abraço,</p>
          <p style="font-size: 16px; font-weight: bold; color: #111; text-align: center; margin-top: 5px;">Equipe BarberUp</p>
        </div>
      `
    });

    res.json({ success: true });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return res.json({ success: true });
    }
    console.error('Error creating password reset email:', error);
    res.status(500).json({ success: false, error: "Erro ao enviar e-mail. Verifique se a variável SMTP_PASSWORD e FIREBASE_SERVICE_ACCOUNT_KEY estão configuradas no servidor." });
  }
});

// Send Verification / Welcome Email via Nodemailer
app.post('/api/send-welcome-email', async (req, res) => {
  try {
    const { email, name, shopName } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    if (!admin.apps.length) {
      return res.status(500).json({ success: false, error: `SDK Admin não configurado para gerar link.` });
    }

    let link;
    try {
      link = await admin.auth().generateEmailVerificationLink(email, {
        url: 'https://usebarberup.com/login'
      });
    } catch (authError) {
      console.error("Admin Auth Error:", authError);
      return res.status(500).json({ 
        success: false, 
        error: `Erro ao gerar link de verificação. (Erro: ${authError.message})`
      });
    }

    await transporter.sendMail({
      from: '"BarberUp" <contato@usebarberup.com>',
      to: email,
      subject: 'Bem-vindo(a) à Elite do BarberUp! Confirme seu acesso ✂️🚀',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <div style="text-align: center; padding: 20px 0;">
            <h2 style="color: #f97316; margin-bottom: 5px;">Acesso Quase Liberado, ${name}! 🚀</h2>
          </div>
          
          <p style="font-size: 16px;">Bem-vindo(a) ao <strong>BarberUp</strong>!</p>
          
          <p style="font-size: 16px;">A partir de agora, a <strong>${shopName}</strong> está pronta para jogar o jogo da alta performance. Criamos o BarberUp para ser sua máquina de crescimento.</p>
          
          <p style="font-size: 16px;">Mas antes de dominar seu mercado e começar a escalar lucros, precisamos apenas que você <strong>confirme seu e-mail</strong> clicando no botão abaixo:</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${link}" style="display: inline-block; background-color: #f97316; color: #ffffff; padding: 16px 32px; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 8px; letter-spacing: 1px; text-transform: uppercase;">Confirmar E-mail ✂️</a>
          </div>
          
          <p style="font-size: 16px;">Estamos lado a lado com você nessa jornada. Qualquer dúvida, é só responder a este e-mail.</p>
          
          <p style="font-size: 16px;">Vamos pra cima! 🔥</p>
          
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          
          <p style="font-size: 14px; color: #666; text-align: center;">Um grande abraço,</p>
          <p style="font-size: 16px; font-weight: bold; color: #111; text-align: center; margin-top: 5px;">Equipe BarberUp</p>
        </div>
      `
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
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
