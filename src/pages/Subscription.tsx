import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { CalendarDays, CreditCard, AlertCircle, CheckCircle2, Crown, Zap, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Subscription() {
  const { profile, isActive } = useAuth();
  const navigate = useNavigate();

  const subscriptionEnd = profile?.subscriptionEnd 
    ? new Date(profile.subscriptionEnd)
    : new Date();

  const isExpired = !isActive;
  
  const daysLeft = differenceInDays(subscriptionEnd, new Date());
  
  const status = profile?.subscriptionStatus;
  const currentPlan = profile?.subscriptionPlan || 'mensal';
  const planNames: Record<string, string> = {
    'mensal': 'Mensal',
    'semestral': 'Semestral',
    'anual': 'Anual'
  };

  const displayName = status === 'trial' ? 'BarberUp Trial' : `BarberUp ${planNames[currentPlan]}`;

  const plans = [
    { id: 'mensal', name: 'Mensal', price: '79,90', icon: Zap, color: 'text-primary' },
    { id: 'semestral', name: 'Semestral', price: '69,90', icon: Shield, color: 'text-blue-500' },
    { id: 'anual', name: 'Anual', price: '59,90', icon: Crown, color: 'text-[#009EE3]' },
  ];

  const handleCheckout = (planId: string) => {
    navigate(`/checkout?plan=${planId}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold uppercase tracking-tighter text-foreground">Assinatura</h1>
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
          Gerencie seu plano e pagamentos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border shadow-sm col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Seu Plano Atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-muted/40 rounded-xl border border-border">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-foreground uppercase tracking-tight">{displayName}</span>
                {isActive ? (
                  <span className="text-lime-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ativa
                  </span>
                ) : (
                  <span className="text-destructive text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Inativa
                  </span>
                )}
              </div>
              <div className="text-left sm:text-right">
                <div className="text-3xl font-bold tracking-tighter text-foreground">
                  {daysLeft > 0 ? daysLeft : 0} <span className="text-base text-muted-foreground tracking-widest uppercase">Dias</span>
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  Restantes na sua assinatura
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Ciclo de Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-border/50">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Início</span>
              <span className="text-sm font-bold text-foreground">
                 {profile?.createdAt ? format(new Date(profile.createdAt), "dd 'de' MMM, yyyy", { locale: ptBR }) : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Vencimento</span>
              <span className={`text-sm font-bold ${(daysLeft <= 5 && daysLeft > 0) ? 'text-amber-500' : daysLeft <= 0 ? 'text-destructive' : 'text-foreground'}`}>
                {(profile?.subscriptionEnd || isActive) ? format(subscriptionEnd, "dd 'de' MMM, yyyy", { locale: ptBR }) : '-'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold uppercase tracking-tighter">Renovar ou Alterar Plano</h2>
          <p className="text-xs text-muted-foreground font-medium">Escolha a melhor modalidade para o seu negócio</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="bg-card border-border shadow-sm hover:border-primary/50 transition-colors">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className={`w-12 h-12 rounded-full bg-muted flex items-center justify-center ${plan.color}`}>
                  <plan.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg uppercase tracking-tight">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline justify-center gap-1">
                    <span className="text-xs font-bold text-muted-foreground">R$</span>
                    <span className="text-3xl font-black">{plan.price}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest">/mês</span>
                  </div>
                </div>
                <Button 
                  onClick={() => handleCheckout(plan.id)}
                  className="w-full h-12 bg-[#009EE3] hover:bg-[#007EB5] text-white font-bold uppercase tracking-widest rounded-xl text-xs mt-4"
                >
                  Assinar {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
