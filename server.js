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

      if (!planId) {
        console.warn("MERCADOPAGO_PREAPPROVAL_PLAN_ID não configurado. O cliente deverá usar o fallback de Preferência.");
        return res.status(400).json({ 
          error: "PLAN_ID_MISSING", 
          details: "ID do plano não configurado no servidor." 
        });
      }

      const { userId, email } = req.body;
      const appUrl = process.env.APP_URL || (req.headers.origin) || "https://tan-loris-476860.hostingersite.com";

      const body = {
        preapproval_plan_id: planId,
        payer: {
          email: email
        },
        back_url: `${appUrl}/checkout/success`,
        reason: "Assinatura BarberUp - Mensal",
        external_reference: userId
      };

      console.log("Enviando requisição ao Mercado Pago:", JSON.stringify(body, null, 2));

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
        return res.status(response.status).json({ 
          error: "Erro ao criar assinatura no Mercado Pago", 
          details: data 
        });
      }

      res.json({ init_point: data.init_point });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message || "Erro interno no servidor" });
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
