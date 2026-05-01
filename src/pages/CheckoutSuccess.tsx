import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';

export default function CheckoutSuccess() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    async function finalizePayment() {
      if (!user) return;
      
      try {
        const searchParams = new URLSearchParams(location.search);
        // Mercado Pago adds these parameters on success return URL:
        const preference_id = searchParams.get('preference_id');
        const payment_id = searchParams.get('payment_id');
        
        // Let's check what their current pending plan is from Firebase
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        const currentData = userSnap.data();
        const pendingPlan = currentData?.subscriptionPlan || 'mensal';
        
        let days = 30;
        if (pendingPlan === 'semestral') days = 180;
        if (pendingPlan === 'anual') days = 365;

        // Update to Active!
        await updateDoc(userRef, {
          subscriptionStatus: 'active',
          subscriptionEnd: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
          lastPaymentId: payment_id || null,
          lastPreferenceId: preference_id || null
        });

        setStatus('success');
        
        // Redirect to dashboard after a delay
        setTimeout(() => {
          navigate('/app/dashboard');
        }, 3000);

      } catch (err) {
        console.error("Error finalizing payment:", err);
        setStatus('error');
      }
    }
    
    finalizePayment();
  }, [user, navigate, location.search]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-sm bg-card border-border shadow-xl">
        <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-[#009EE3] mb-2" />
              <h2 className="text-xl font-bold uppercase tracking-tight">Confirmando Pagamento...</h2>
              <p className="text-sm text-zinc-400">Por favor, aguarde enquanto ativamos seu acesso.</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="w-16 h-16 text-lime-400 mb-2" />
              <h2 className="text-xl font-bold uppercase tracking-tight">Pagamento Aprovado!</h2>
              <p className="text-sm text-zinc-400">Seu plano foi ativado com sucesso. Você será redirecionado em instantes.</p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-2">
                <span className="text-2xl font-bold">X</span>
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight">Erro na Confirmação</h2>
              <p className="text-sm text-zinc-400">Houve um erro ao processar sua assinatura. Contate o suporte.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
