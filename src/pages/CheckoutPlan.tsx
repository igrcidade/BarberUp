import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';

export default function CheckoutPlan() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const searchParams = new URLSearchParams(location.search);
  const planParam = searchParams.get('plan') || 'mensal';
  
  const [loading, setLoading] = useState(false);

  const planDetails = {
    mensal: { name: 'Mensal', price: '79,90', period: 'mês', isSubscription: true },
    semestral: { name: 'Semestral', price: '419,40', period: 'semestre', isSubscription: false },
    anual: { name: 'Anual', price: '718,80', period: 'ano', isSubscription: false }
  };

  const selectedPlan = planDetails[planParam as keyof typeof planDetails] || planDetails.mensal;

  const handlePayment = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let endpoint = '/api/create-preference';
      let payload: any = {
        planId: planParam,
        title: `Assinatura BarberUp - Plano ${selectedPlan.name}`,
        price: selectedPlan.price.replace(',', '.'),
        quantity: 1,
        userId: user.uid
      };

      if (selectedPlan.isSubscription) {
        try {
          endpoint = '/api/create-subscription';
          payload = {
              userId: user.uid,
              email: user.email
          };

          console.log('Tentando criar assinatura de teste...');
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const data = await response.json();
          
          if (response.ok && data.init_point) {
            console.log('Assinatura criada com sucesso!');
            window.location.href = data.init_point;
            return;
          }
          
          // Se não houver Plano configurado, caímos para o Checkout Pro (Preferência) para validar a integração
          console.warn('Subscription Plan ID não encontrado. Usando Checkout Pro para validar teste no Mercado Pago.');
        } catch (subErr) {
          console.error('Falha na assinatura, tentando checkout avulso para teste:', subErr);
        }
      }

      // Checkout Avulso (Fallback para teste de integração)
      console.log('Iniciando Checkout Pro (Preferência) para validação...');
      endpoint = '/api/create-preference';
      payload = {
        planId: planParam,
        title: `Teste BarberUp - ${selectedPlan.name}`,
        price: selectedPlan.price.replace(',', '.'),
        quantity: 1,
        userId: user.uid
      };

      const respPref = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const dataPref = await respPref.json();
      
      if (!respPref.ok) {
        throw dataPref;
      }

      if (dataPref.init_point) {
        window.location.href = dataPref.init_point;
      } else {
        throw new Error('Link de pagamento não retornado');
      }
    } catch (e: any) {
      console.error('Payment Error:', e);
      let errorMessage = e.error || e.message || 'Erro ao processar pagamento';
      
      if (e.details) {
        // Se detalhes for um objeto (erro do MP), extrai a mensagem ou causa
        const details = typeof e.details === 'object' 
          ? (e.details.message || (e.details.cause && e.details.cause[0]?.description) || JSON.stringify(e.details))
          : e.details;
        errorMessage += `\n\nDetalhes: ${details}`;
      }
      
      alert(errorMessage + '\n\nCertifique-se de configurar o Token do Mercado Pago em Produção!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-6">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold uppercase tracking-tight">Finalizar Assinatura</h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest text-[#009EE3]">Integração Mercado Pago</p>
        </div>

        <Card className="bg-card border-border shadow-xl">
          <CardContent className="p-8 space-y-6">
            <div className="bg-muted p-4 rounded-xl flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-tight text-white">Plano {selectedPlan.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">Acesso completo ao BarberUp</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">R$ {selectedPlan.price}</span><span className="text-xs text-muted-foreground uppercase tracking-widest">/{selectedPlan.period}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#009EE3]" /> Pagamento 100% seguro pelo Mercado Pago
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#009EE3]" /> Renovação automática e transparente
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#009EE3]" /> Liberação imediata após aprovação
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-6">
                <h4 className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-1">Processamento de Pagamento</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Você será redirecionado para o ambiente seguro do <span className="text-[#009EE3] font-bold">Mercado Pago</span> para finalizar o pagamento com Pix, Cartão de Crédito ou Saldo.
                </p>
              </div>

              <Button 
                onClick={handlePayment} 
                disabled={loading}
                className="w-full h-14 bg-[#009EE3] hover:bg-[#007EB5] text-white font-bold uppercase tracking-widest text-sm rounded-xl"
              >
                {loading ? 'Processando...' : (
                  <span className="flex items-center gap-2 text-white">
                    <CreditCard className="w-5 h-5 text-white" /> Pagar com Mercado Pago
                  </span>
                )}
              </Button>
              <p className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-4 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> Transação Criptografada
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
