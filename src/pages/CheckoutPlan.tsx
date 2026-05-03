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
    mensal: { name: 'Mensal', price: '79,90', period: 'mês', displayPrice: '79,90', totalText: '', planType: 'mensal' },
    semestral: { name: 'Semestral', price: '419,10', period: 'mês', displayPrice: '69,85', totalText: 'Total R$ 419,10 / semestre', planType: 'semestral' },
    anual: { name: 'Anual', price: '718,80', period: 'mês', displayPrice: '59,90', totalText: 'Total R$ 718,80 / ano', planType: 'anual' }
  };

  const selectedPlan = planDetails[planParam as keyof typeof planDetails] || planDetails.mensal;

  const handlePayment = async () => {
    if (!user || !user.email) return;
    setLoading(true);

    try {
      console.log('Iniciando Checkout Pro para:', selectedPlan.name);
      
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          title: `BarberUp - Plano ${selectedPlan.name}`,
          price: selectedPlan.price.replace(',', '.'),
          planType: selectedPlan.planType
        })
      });

      const data = await response.json();
      
      if (response.ok && data.init_point) {
        window.location.href = data.init_point;
        return;
      }
      
      throw data;
    } catch (e: any) {
      console.error('Payment Error:', e);
      alert(e.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-6">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold uppercase tracking-tight">Finalizar Pagamento</h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest text-[#009EE3]">Acesso BarberUp</p>
        </div>

        <Card className="bg-card border-border shadow-xl">
          <CardContent className="p-8 space-y-6">
            <div className="bg-muted p-4 rounded-xl flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-tight text-white">Plano {selectedPlan.name}</h3>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{selectedPlan.totalText || 'Acesso mensal completo'}</p>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                   <span className="text-xs text-muted-foreground font-bold">R$</span>
                   <span className="text-3xl font-black text-white">{selectedPlan.displayPrice}</span>
                   <span className="text-[10px] text-muted-foreground font-bold uppercase">/{selectedPlan.period}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#009EE3]" /> Pagamento Único via Pix ou Cartão
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#009EE3]" /> Sem cobranças automáticas futuras
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
