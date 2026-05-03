import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { CalendarDays, CreditCard, AlertCircle, CheckCircle2, Crown, Zap, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';

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
    { 
      id: 'mensal', 
      name: 'Mensal', 
      price: '79,90', 
      period: '/mês', 
      description: 'Ideal para quem está começando agora.',
      features: ['Gestão de Agendamentos', 'Controle Financeiro', 'PDV Completo', 'Até 2 Profissionais'],
      popular: false
    },
    { 
      id: 'anual', 
      name: 'Anual', 
      price: '59,90', 
      period: '/mês', 
      billed: 'Valor Total: R$ 718,80',
      description: 'O melhor custo-benefício para sua elite.',
      features: ['Tudo do Mensal', 'Gestão de Estoque', 'Relatórios de Retenção', 'Profissionais Ilimitados', 'Suporte Prioritário'],
      popular: true
    },
    { 
      id: 'semestral', 
      name: 'Semestral', 
      price: '69,90', 
      period: '/mês', 
      billed: 'Valor Total: R$ 419,40',
      description: 'Equilíbrio perfeito para seu crescimento.',
      features: ['Tudo do Mensal', 'Gestão de Estoque', 'Até 5 Profissionais', 'Suporte via WhatsApp'],
      popular: false
    }
  ];

  const handleCheckout = (planId: string) => {
    navigate(`/checkout?plan=${planId}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-foreground">Minha Assinatura</h1>
        <p className="text-muted-foreground text-xs font-medium">
          Gerencie seu plano e pagamentos ativos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border shadow-sm col-span-1 md:col-span-2 overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-lime-500 opacity-50" />
          <CardHeader>
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Status da Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 bg-muted/30 rounded-2xl border border-border/50">
              <div className="flex flex-col gap-2">
                <span className="text-xl font-bold text-foreground tracking-wide leading-none">{displayName}</span>
                {isActive ? (
                  <Badge className="bg-lime-500/10 text-lime-500 border-lime-500/20 w-fit font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 mt-1">
                    Assinatura Ativa
                  </Badge>
                ) : (
                  <Badge className="bg-destructive/10 text-destructive border-destructive/20 w-fit font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 mt-1">
                    Assinatura Vencida
                  </Badge>
                )}
              </div>
              <div className="text-left sm:text-right flex flex-col items-center sm:items-end">
                <div className="text-2xl font-bold tracking-tight text-foreground leading-none">
                  {daysLeft > 0 ? daysLeft : 0}
                </div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2">
                  Dias Restantes
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm overflow-hidden relative">
          <CardHeader>
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Próximo Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center py-4 border-b border-border/30">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Início do Ciclo</span>
              <span className="text-xs font-bold text-foreground">
                 {profile?.createdAt ? format(new Date(profile.createdAt), "dd MMM yyyy", { locale: ptBR }) : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center py-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vencimento</span>
              <span className={`text-xs font-bold ${(daysLeft <= 5 && daysLeft > 0) ? 'text-orange-500' : daysLeft <= 0 ? 'text-destructive' : 'text-foreground'}`}>
                {(profile?.subscriptionEnd || isActive) ? format(subscriptionEnd, "dd MMM yyyy", { locale: ptBR }) : '-'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 pt-10 max-w-5xl mx-auto">
        <div className="flex flex-col gap-2 border-l-4 border-orange-500 pl-4">
          <h2 className="text-xl font-bold uppercase tracking-tight text-foreground">Renovar ou Mudar de Nível</h2>
          <p className="text-xs text-muted-foreground font-medium">Sua barbearia merece o melhor</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {plans.map((plan) => (
            <motion.div 
              key={plan.id}
              whileHover={{ y: -5 }}
              className={`relative p-8 rounded-3xl border flex flex-col justify-between transition-all duration-300 ${
                plan.popular 
                ? 'bg-card border-orange-500 shadow-xl shadow-orange-500/5' 
                : 'bg-card border-border hover:border-primary/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-black font-bold uppercase text-[10px] px-4 py-1 rounded-full tracking-wider shadow-md">
                  Recomendado
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-tight text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed min-h-[36px]">
                    {plan.description}
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      R$ {plan.price}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                  {plan.billed && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mt-2">
                       {plan.billed}
                    </p>
                  )}
                </div>

                <div className="h-px w-full bg-border/50" />

                <ul className="space-y-3">
                  {plan.features.map(feat => (
                    <li key={feat} className="flex items-center gap-3 text-xs font-medium text-foreground/80">
                      <div className="w-4 h-4 rounded-full bg-lime-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-lime-500" />
                      </div>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <Button 
                onClick={() => handleCheckout(plan.id)}
                className={`w-full h-12 rounded-xl font-bold text-xs uppercase tracking-wider mt-10 transition-all ${
                  plan.popular 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md' 
                  : 'bg-foreground text-background hover:opacity-90'
                }`}
              >
                Escolher {plan.name}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
