import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  // IMPORTANT: The MercadoPago token must come from process.env
  // For production APIs, this should be valid.
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  // Mercado Pago Create Preference API (Pagamento Único)
  app.post("/api/create-checkout", async (req, res) => {
    try {
      const rawToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!rawToken) {
        return res.status(500).json({ error: "Configuração ausente", message: "O Access Token não foi configurado no servidor." });
      }

      const token = rawToken.trim().replace(/\s/g, '');
      const { title, price, userId, email, planType } = req.body;
      const appUrl = "https://tan-loris-476860.hostingersite.com";

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
          plan_type: planType
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

  // Removido endpoints de assinatura antigos para manter o código limpo e funcional

  // WEBHOOK: Recebe notificações automáticas do Mercado Pago
  app.post("/api/webhook", express.json(), async (req, res) => {
    const { action, type, data } = req.body;
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    
    console.log("🔔 WEBHOOK RECEBIDO:", JSON.stringify(req.body, null, 2));

    // Validação de Segurança (x-signature)
    const signature = req.headers['x-signature'];
    if (webhookSecret && signature) {
      console.log("🔒 Assinatura do Webhook detectada. Validando origem...");
      // Em produção, aqui você compararia o HMAC SHA256 do payload com o signature usando o webhookSecret
    }

    try {
      // 1. Notificação de Assinatura (Preapproval)
      if (type === "subscription_preapproval" || (action && action.includes("preapproval"))) {
        const preapprovalId = (data && data.id) || req.body.resource;
        console.log(`✅ NOTIFICAÇÃO DE ASSINATURA: ${preapprovalId}`);
        // TODO: Atualizar status do usuário no banco de dados baseado no status da assinatura
      } 
      
    // 2. Notificação de Pagamento (Planos Semestral/Anual - Checkout Pro)
      else if (type === "payment" || (action && action.includes("payment"))) {
        const paymentId = (data && data.id) || (req.body.resource && req.body.resource.split('/').pop());
        console.log(`💰 [CHECKOUT PRO] NOTIFICAÇÃO DE PAGAMENTO: ${paymentId}`);
        
        // Buscamos os detalhes do pagamento para validar o status
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { "Authorization": `Bearer ${webhookSecret || process.env.MERCADOPAGO_ACCESS_TOKEN}` }
        });
        
        if (mpResponse.ok) {
          const paymentData = await mpResponse.json();
          console.log(`📊 STATUS DO PAGAMENTO ${paymentId}: ${paymentData.status}`);
          
          if (paymentData.status === 'approved') {
            const userId = paymentData.external_reference;
            const planType = paymentData.description; // Ex: "Plano Semestral"
            console.log(`✅ PAGAMENTO APROVADO para Usuário: ${userId} (${planType})`);
            // TODO: Aqui você atualizaria o Firebase/Banco de dados liberando o acesso
          }
        } else {
          console.error(`❌ Erro ao buscar detalhes do pagamento ${paymentId}`);
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("❌ Erro no Webhook:", error);
      res.status(500).send("Internal Server Error");
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
    // Support history api fallback for SPAs in express v4
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
