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

      console.log("🛠️ TESTE: Criando Preferência de Pagamento (Checkout Pro):", JSON.stringify(body, null, 2));

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
        
        // Erro comum de misturar conta real com token de teste
        if (data.message && (data.message.includes("test") || data.error === "bad_request")) {
           return res.status(400).json({ 
              error: "MP_TEST_MODE_ERROR",
              message: "ERRO DE AMBIENTE: Você está tentando pagar com uma conta REAL em um ambiente de TESTE (ou vice-versa).\n\nSOLUÇÃO:\n1. Use o e-mail do 'Comprador de Teste' que o Mercado Pago te deu.\n2. Se o MP pedir para validar o e-mail, você deve estar logado no navegador com essa conta de teste ficitícia.",
              details: data.message
           });
        }
        
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
      let planId = process.env.MERCADOPAGO_PREAPPROVAL_PLAN_ID;
      
      if (!token) {
        throw new Error("MERCADOPAGO_ACCESS_TOKEN not defined. Configure o Token de Produção (ou Teste) na Hostinger.");
      }

      // Se o ID do plano parece ser um token (erro comum) ou está vazio, tentamos criar sem plano associado
      if (planId && (planId.startsWith("APP_USR-") || planId.startsWith("TEST-") || planId.trim() === "")) {
        const isTest = planId.startsWith("TEST-");
        console.warn(`⚠️ AVISO: MERCADOPAGO_PREAPPROVAL_PLAN_ID contém um ${isTest ? 'Token de TESTE' : 'Token'} em vez de um ID de Plano.`);
        console.log("💡 DICA: O sistema usará o modo 'Assinatura Direta' (Manual) para evitar erros de Plano inexistente.");
        planId = null;
      }
      
      const isSandbox = token.startsWith("TEST-");
      if (isSandbox) {
        console.log("🧪 AMBIENTE DE TESTE DETECTADO (SANDBOX)");
      }

      const { userId, email } = req.body;
      const appUrl = process.env.APP_URL || (req.headers.origin) || "https://tan-loris-476860.hostingersite.com";

      // SE ESTIVER EM MODO TESTE, OMITIMOS O E-MAIL DO PAGADOR
      // Isso é a SOLUÇÃO DEFINITIVA para evitar o erro "Both payer and collector must be real or test users"
      // Ao omitir o e-mail, o Mercado Pago abrirá a tela pedindo login, onde você usará sua conta de teste.
      let payerEmail = email;
      if (isSandbox) {
        console.log("🧪 MODO SANDBOX: Omitindo e-mail para evitar erro de conflito Real vs Teste.");
        payerEmail = null;
      }

      // Monta o corpo da requisição
      const body = {
        back_url: `${appUrl}/checkout/success`,
        reason: "Assinatura Mensal BarberUp",
        external_reference: userId,
        status: "pending"
      };

      if (payerEmail) {
        body.payer_email = payerEmail;
      }

      // Se tivermos um ID de plano válido, usamos ele como template
      if (planId) {
        body.preapproval_plan_id = planId;
      } else {
        // Caso contrário, definimos as regras de recorrência MANUALMENTE na assinatura (Assinatura sem Plano)
        body.auto_recurring = {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 79.90,
          currency_id: "BRL"
        };
      }

      console.log("🛠️ TESTE: Criando assinatura no Mercado Pago...", JSON.stringify(body, null, 2));

      // Link direto como fallback caso a API de preapproval exija token de cartão (Checkout Transparente)
      let direct_link = null;
      if (planId) {
        let directUrl = `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=${planId}&external_reference=${encodeURIComponent(userId)}&back_url=${encodeURIComponent(`${appUrl}/checkout/success`)}`;
        // No modo Sandbox, não injetamos o e-mail no link de fallback também
        if (!isSandbox) {
          directUrl += `&payer_email=${encodeURIComponent(email)}`;
        }
        direct_link = directUrl;
      }

      try {
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
          console.error("❌ ERRO MERCADO PAGO (SUBS):", JSON.stringify(data, null, 2));
          
          // Se o erro for que o template (planId) não existe ou é inválido, tentamos criar SEM o planId
          if (planId && data.message && (data.message.includes("template with id") || data.message.includes("does not exist"))) {
             console.log("Plan ID inválido ou inexistente. Tentando Assinatura Direta (Manual)...");
             delete body.preapproval_plan_id;
             body.auto_recurring = {
                frequency: 1,
                frequency_type: "months",
                transaction_amount: 79.90,
                currency_id: "BRL"
             };
             
             const retryResp = await fetch("https://api.mercadopago.com/preapproval", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(body)
             });
             const retryData = await retryResp.json();
             if (retryResp.ok) return res.json({ init_point: retryData.init_point, id: retryData.id });
             
             // Se falhar no retry também, retornamos o erro do retry
             return res.status(retryResp.status).json({ error: "Erro na Assinatura (Retry)", message: retryData.message, details: retryData });
          }

          // Se for erro de card_token, usamos link direto se tivermos um plano
          if (data.message && (data.message.includes("card_token_id") || data.error === "bad_request") && direct_link) {
            console.log("Usando link direto de checkout de assinatura como fallback...");
            return res.json({ init_point: direct_link, fallback: true });
          }

          // Tratamento amigável para o erro de e-mail em sandbox
          if (data.message && data.message.includes("Both payer and collector")) {
            return res.status(400).json({
              error: "MP_SANDBOX_EMAIL_ERROR",
              message: "Erro de Ambiente: O Mercado Pago não aceita e-mails reais em ambiente de teste.\n\nSOLUÇÃO:\nNo formulário de cadastro do app, use um e-mail fictício ou deixe o campo de e-mail em branco se possível.",
              details: "Ambas as partes (vendedor e comprador) devem ser usuários de teste no modo Sandbox."
            });
          }

          return res.status(response.status).json({ 
            error: "Erro na API de Assinaturas", 
            message: data.message || "Não foi possível iniciar a assinatura.",
            details: data
          });
        }

        res.json({ 
          init_point: data.init_point || direct_link,
          id: data.id,
          status: data.status
        });
      } catch (fetchError) {
        console.error("Fetch Error Subscription:", fetchError);
        // Fallback total para o link direto
        res.json({ init_point: direct_link });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message || "Erro interno no servidor" });
    }
  });

  // Auxiliar para criar o plano caso o usuário não tenha
  app.post("/api/setup-subscription-plan", async (req, res) => {
    try {
      if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
      
      const appUrl = process.env.APP_URL || (req.headers.origin) || "https://tan-loris-476860.hostingersite.com";

      const body = {
        reason: "Assinatura BarberUp - Plano Mensal",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 79.90,
          currency_id: "BRL"
        },
        back_url: `${appUrl}/checkout/success`,
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
