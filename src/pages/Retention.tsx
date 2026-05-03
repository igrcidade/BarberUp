import React, { useEffect, useState } from 'react';
import { 
  Users, UserCheck, UserX, TrendingUp, History, 
  MessageSquare, ShoppingBag, Star, Zap, Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { subscribeToCollection } from '../lib/db';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';

export default function Retention() {
  const [clients, setClients] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'Ativos' | 'Em Risco' | 'Inativos'>('Inativos');

  useEffect(() => {
    const unsubClients = subscribeToCollection('clients', setClients);
    const unsubSales = subscribeToCollection('sales', setSales);
    return () => {
      unsubClients();
      unsubSales();
    };
  }, []);

  const analyzedClients = clients.map(client => {
    const clientSales = sales.filter(s => s.clientId === client.id).sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : parseISO(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : parseISO(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    const lastVisit = clientSales[0];
    const daysSinceLastVisit = lastVisit 
      ? differenceInDays(new Date(), lastVisit.createdAt?.toDate ? lastVisit.createdAt.toDate() : parseISO(lastVisit.createdAt))
      : 999;

    return {
      ...client,
      daysSinceLastVisit,
      lastVisitDate: lastVisit ? (lastVisit.createdAt?.toDate ? lastVisit.createdAt.toDate() : parseISO(lastVisit.createdAt)) : null,
      visitCount: clientSales.length,
      totalSpent: clientSales.reduce((acc, curr) => acc + (curr.total || 0), 0)
    };
  });

  const activeClients = analyzedClients.filter(c => c.daysSinceLastVisit <= 45);
  const inactiveClients = analyzedClients.filter(c => c.daysSinceLastVisit > 45 && c.visitCount > 0);
  const riskClients = analyzedClients.filter(c => c.daysSinceLastVisit > 30 && c.daysSinceLastVisit <= 45);

  const retentionData = [
    { name: 'Ativos', value: activeClients.length, color: '#f59e0b' },
    { name: 'Em Risco', value: riskClients.length, color: '#f97316' },
    { name: 'Inativos', value: inactiveClients.length, color: '#ef4444' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="space-y-1.5 text-left">
        <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">
          Saúde da <span className="text-primary">Carteira</span>
        </h1>
        <p className="text-muted-foreground text-sm font-medium">Analise o comportamento de recompra e fidelidade dos seus clientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Taxa de Retenção', value: clients.length > 0 ? ((activeClients.length / clients.length) * 100).toFixed(1) : 0, icon: UserCheck, color: 'text-secondary', bgColor: 'bg-secondary/10', detail: 'Clientes ativos na base' },
          { title: 'Churn em Potencial', value: riskClients.length, icon: UserX, color: 'text-primary', bgColor: 'bg-primary/10', detail: 'Sem visita há 30+ dias' },
          { title: 'Frequência Média', value: analyzedClients.length > 0 ? (analyzedClients.reduce((acc, curr) => acc + curr.visitCount, 0) / analyzedClients.length).toFixed(1) : 0, icon: Activity, color: 'text-primary', bgColor: 'bg-primary/10', detail: 'Visitas por membro' },
        ].map((kpi, i) => (
          <motion.div key={kpi.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-border bg-card rounded-2xl p-6 border shadow-sm group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 p-0">
                <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{kpi.title}</CardTitle>
                <div className={`p-2 rounded-lg border border-border ${kpi.bgColor} ${kpi.color}`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="pt-4 p-0">
                <div className="text-4xl font-bold text-foreground tracking-tight">
                  {kpi.value}<span className="text-lg font-medium ml-0.5 opacity-40">{kpi.title.includes('Taxa') ? '%' : ''}</span>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-3 tracking-tight opacity-60">{kpi.detail}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-border bg-card rounded-3xl border shadow-sm overflow-hidden">
          <CardHeader className="p-8 border-b border-border bg-muted/20">
            <CardTitle className="text-lg font-bold text-foreground uppercase tracking-tight flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              Distribuição de Base
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs font-medium">Proporção de engajamento dos clientes por tempo de ausência</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={retentionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: 'currentColor', fontWeight: 600, textTransform: 'uppercase' }} 
                  />
                  <YAxis axisLine={false} tickLine={false} hide />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(var(--primary), 0.05)' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '10px' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 4, 4]} barSize={60}>
                    {retentionData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        className="cursor-pointer" 
                        onClick={() => setSelectedCategory(entry.name as any)}
                        opacity={selectedCategory === entry.name ? 1 : 0.5}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {retentionData.map(item => (
                <div 
                  key={item.name} 
                  className={`flex flex-col items-center p-3 rounded-xl border cursor-pointer transition-all ${selectedCategory === item.name ? 'bg-primary/5 border-primary shadow-sm' : 'bg-muted/20 border-border hover:bg-muted/40'}`}
                  onClick={() => setSelectedCategory(item.name as any)}
                >
                  <span className={`text-[8px] font-bold uppercase mb-1 ${selectedCategory === item.name ? 'text-primary' : 'text-muted-foreground'}`}>{item.name}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-foreground tracking-tight">{item.value}</span>
                    <span className={`text-[8px] font-bold uppercase leading-none opacity-50 ${selectedCategory === item.name ? 'text-primary' : 'text-foreground'}`}>pax</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card rounded-3xl border shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="p-8 border-b border-border bg-muted/20">
            <CardTitle className="text-lg font-bold text-foreground uppercase tracking-tight flex items-center gap-3">
              <Zap className="w-5 h-5 text-primary" />
              {selectedCategory === 'Inativos' ? 'Missão Resgate' : selectedCategory === 'Em Risco' ? 'Operação Risco' : 'Base Engajada'}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs font-medium">
              {selectedCategory === 'Inativos' 
                ? 'Clientes que não visitaram a unidade há mais de 45 dias'
                : selectedCategory === 'Em Risco'
                ? 'Clientes entre 30 e 45 dias sem visita'
                : 'Clientes que visitaram a unidade nos últimos 45 dias'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <div className="overflow-y-auto max-h-[440px] px-2 py-2">
              <AnimatePresence>
                {(selectedCategory === 'Inativos' ? inactiveClients : selectedCategory === 'Em Risco' ? riskClients : activeClients).slice(0, 50).map((client, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    key={client.id} 
                    className="flex items-center justify-between p-4 hover:bg-muted/10 transition-all group rounded-xl mb-1 border border-transparent hover:border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[9px] border shadow-sm ${client.daysSinceLastVisit > 45 ? 'bg-destructive/10 text-destructive border-destructive/20' : client.daysSinceLastVisit > 30 ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                        {client.daysSinceLastVisit > 45 ? 'OFF' : client.daysSinceLastVisit > 30 ? 'RISK' : 'ON'}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-foreground tracking-tight uppercase leading-none">{client.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[7px] font-bold bg-muted/30 border-border text-muted-foreground px-1.5 py-0 uppercase">Ausente há {client.daysSinceLastVisit} dias</Badge>
                          {client.phone && <span className="text-[9px] text-muted-foreground font-medium">{client.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 px-4 rounded-lg text-[9px] font-bold uppercase gap-2 hover:bg-primary hover:text-primary-foreground border-primary/20 text-primary transition-all shrink-0"
                      onClick={() => window.open(`https://wa.me/55${client.phone?.replace(/\D/g, '')}?text=Olá ${client.name}! Faz tempo que não te vemos na barbearia. Que tal agendar um horário?`, '_blank')}
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> MENSAGEM
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {(selectedCategory === 'Inativos' ? inactiveClients : selectedCategory === 'Em Risco' ? riskClients : activeClients).length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-10">
                  <Star className="w-12 h-12" />
                  <p className="text-xl font-bold uppercase tracking-tight">Vazio</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
