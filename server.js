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

  // Mercado Pago Create Preference API
  app.post("/api/create-preference", async (req, res) => {
    try {
      if (!token) {
        throw new Error("MERCADOPAGO_ACCESS_TOKEN is not defined in environment variables");
      }

      const { title, price, quantity, planId, userId } = req.body;

      const body = {
        items: [
          {
            id: planId || "plan-id",
            title: title,
            quantity: quantity || 1,
            unit_price: Number(price),
            currency_id: "BRL"
          }
        ],
        payer: {
          email: userId ? `${userId}@test.com` : "customer@test.com"
        },
        metadata: {
          user_id: userId,
          plan_id: planId
        },
        back_urls: {
          success: `${process.env.APP_URL || "https://tan-loris-476860.hostingersite.com"}/checkout/success`,
          failure: `${process.env.APP_URL || "https://tan-loris-476860.hostingersite.com"}/checkout/failure`,
          pending: `${process.env.APP_URL || "https://tan-loris-476860.hostingersite.com"}/checkout/pending`
        },
        auto_return: "approved",
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
        console.error("Mercado Pago API Error:", data);
        return res.status(response.status).json({ error: "Erro ao criar preferência de pagamento", details: data });
      }

      res.json({ id: data.id, init_point: data.init_point });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message || "Erro interno no servidor" });
    }
  });

  // Mercado Pago Create Subscription API
  app.post("/api/create-subscription", async (req, res) => {
    try {
      const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
      const planId = process.env.MERCADOPAGO_PREAPPROVAL_PLAN_ID;
      
      if (!token) {
        throw new Error("MERCADOPAGO_ACCESS_TOKEN not defined. Configure o Token de Produção (ou Teste) na Hostinger.");
      }

      // Se o ID do plano estiver faltando, tentamos informar como criar um ou criamos um temporário
      if (!planId) {
        console.warn("MERCADOPAGO_PREAPPROVAL_PLAN_ID não configurado.");
        return res.status(400).json({ 
          error: "PLAN_ID_MISSING", 
          message: "Você ainda não configurou o ID do Plano de Assinatura.",
          action: "Crie um plano no Mercado Pago ou use nossa ferramenta de setup."
        });
      }

      const { userId, email } = req.body;
      const appUrl = process.env.APP_URL || (req.headers.origin) || "https://tan-loris-476860.hostingersite.com";

      const body = {
        preapproval_plan_id: planId,
        payer_email: email,
        back_url: `${appUrl}/checkout/success`,
        reason: "Assinatura BarberUp - Plano Mensal",
        external_reference: userId,
        status: "pending"
      };

      console.log("Enviando requisição ao Mercado Pago (Assinatura):", JSON.stringify(body, null, 2));

      const response = await fetch("https://api.mercadopago.com/preapproval", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("Mercado Pago Subscription API Error Details:", JSON.stringify(data, null, 2));
        
        // Identificar especificamente o erro de ID de plano inexistente/incorreto
        if (data.message && data.message.includes("template with id") && data.message.includes("does not exist")) {
           return res.status(400).json({ 
            error: "PLAN_ID_INVALID", 
            message: "O ID do plano configurado na Hostinger não é um Plano válido. Você parece ter colocado o seu User ID no lugar do ID do Plano.",
            details: data.message
          });
        }

        return res.status(response.status).json({ 
          error: "Erro ao criar assinatura no Mercado Pago", 
          details: data 
        });
      }

      // FORMATO SEGURO: Link direto de checkout de assinatura do Mercado Pago
      const direct_link = `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=${planId}`;

      res.json({ 
        init_point: data.init_point || direct_link,
        id: data.id,
        status: data.status
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message || "Erro interno no servidor" });
    }
  });

  // Auxiliar para criar o plano caso o usuário não tenha
  app.post("/api/setup-subscription-plan", async (req, res) => {
    try {
      if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
      
      const body = {
        reason: "Assinatura BarberUp - Plano Mensal",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 79.90,
          currency_id: "BRL"
        },
        back_url: "https://tan-loris-476860.hostingersite.com/checkout/success",
        status: "active"
      };

      const resp = await fetch("https://api.mercadopago.com/preapproval_plan", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const data = await resp.json();
      
      if (!resp.ok) {
        return res.status(resp.status).json({ error: "Erro ao criar plano", details: data });
      }

      res.json({ 
        message: "Plano criado com sucesso para testes!", 
        plan_id: data.id,
        instruction: "COPIE ESTE ID E COLOQUE NA VARIÁVEL MERCADOPAGO_PREAPPROVAL_PLAN_ID NA HOSTINGER"
      });
    } catch (error) {
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
