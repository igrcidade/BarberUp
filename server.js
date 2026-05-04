import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar configuração do Firebase para o Admin SDK
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig = {};
if (fs.existsSync(firebaseConfigPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
}

// Inicializar Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId
  });
}

const db = admin.firestore();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  // Mercado Pago Create Preference API
  app.post("/api/create-checkout", async (req, res) => {
    try {
      const rawToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!rawToken) {
        return res.status(500).json({ error: "Configuração ausente", message: "O Access Token não foi configurado no servidor." });
      }

      const token = rawToken.trim().replace(/\s/g, '');
      const { title, price, userId, email, planType } = req.body;
      
      // Obter o host dinamicamente para back_urls
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const appUrl = `${protocol}://${host}`;

      console.log(`📡 Criando Checkout para: ${title} (R$ ${price}) - Usuário: ${email}`);

      const body = {
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
          email: email.trim().toLowerCase()
        },
        external_reference: userId,
        metadata: {
          user_id: userId,
          plan_type: planType // mensal, semestral, anual
        },
        back_urls: {
          success: `${appUrl}/checkout/success`,
          failure: `${appUrl}/app/subscription`,
          pending: `${appUrl}/checkout/pending`
        },
        auto_return: "approved",
        statement_descriptor: "BARBERUP"
      };

      const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("❌ ERRO MERCADO PAGO:", JSON.stringify(data, null, 2));
        return res.status(response.status).json({ 
          error: "Erro no Checkout", 
          message: data.message || "Não foi possível gerar o link de pagamento.",
          details: data
        });
      }

      console.log("✅ Checkout Pro gerado com sucesso.");
      res.json({ init_point: data.init_point, id: data.id });
    } catch (error) {
      console.error("💥 Falha no Checkout:", error);
      res.status(500).json({ error: "Erro Interno", message: "Erro ao processar pagamento no servidor." });
    }
  });

  // WEBHOOK: Recebe notificações automáticas do Mercado Pago
  app.post("/api/webhook", express.json(), async (req, res) => {
    const { action, type, data } = req.body;
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    console.log("🔔 WEBHOOK RECEBIDO:", JSON.stringify(req.body, null, 2));

    try {
      // Notificação de Pagamento (Checkout Pro)
      if (type === "payment" || (action && action.includes("payment"))) {
        const paymentId = (data && data.id) || (req.body.resource && req.body.resource.split('/').pop());
        
        // Buscamos os detalhes do pagamento para validar o status e pegar os metadados
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (mpResponse.ok) {
          const paymentData = await mpResponse.json();
          console.log(`📊 STATUS DO PAGAMENTO ${paymentId}: ${paymentData.status}`);
          
          if (paymentData.status === 'approved') {
            const userId = paymentData.external_reference || (paymentData.metadata && paymentData.metadata.user_id);
            const planType = (paymentData.metadata && paymentData.metadata.plan_type) || "mensal";
            
            if (!userId) {
              console.error("❌ Erro: Payment aprovado mas userId não encontrado nos metadados/external_reference");
              return res.status(200).send("OK but no user id");
            }

            // Calcular nova expiração
            let daysToAdd = 30;
            if (planType === 'semestral') daysToAdd = 180;
            if (planType === 'anual') daysToAdd = 365;

            const now = new Date();
            const expirationDate = new Date();
            expirationDate.setDate(now.getDate() + daysToAdd);

            console.log(`✅ ATIVANDO PLANO: ${planType} para Usuário: ${userId}. Expiração: ${expirationDate.toISOString()}`);

            // Atualizar Perfil no Firestore (Usando a coleção 'users' para consistência)
            const profileRef = db.collection('users').doc(userId);
            await profileRef.set({
              activeSubscription: true,
              subscriptionPlan: planType,
              subscriptionStatus: 'active',
              subscriptionEnd: expirationDate.toISOString(),
              lastPaymentId: paymentId,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log("🔥 Banco de dados atualizado com sucesso!");
          }
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("❌ Erro no Webhook:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // ROTA ADMINISTRATIVA: Reset de Senha (Master Admin requisita)
  app.post("/api/admin/reset-password", async (req, res) => {
    const { email, newPassword, adminEmail } = req.body;

    // Verificação de segurança adicional (Master Admin)
    const masters = ['igor.cidade@hotmail.com', 'igrcidade@gmail.com'];
    if (!masters.includes(adminEmail)) {
      return res.status(403).json({ error: "Não autorizado" });
    }

    try {
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().updateUser(user.uid, {
        password: newPassword
      });
      console.log(`🔐 Senha do usuário ${email} resetada por ${adminEmail}`);
      res.json({ success: true, message: "Senha alterada com sucesso." });
    } catch (error) {
      console.error("❌ Erro ao resetar senha:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
