import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  UserCheck,
  Scissors,
  Package,
  Calendar as CalendarIcon,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area
} from 'recharts';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function MockDashboard() {
  const chartData = [
    { name: '01/05', sales: 1200 },
    { name: '02/05', sales: 1540 },
    { name: '03/05', sales: 1100 },
    { name: '04/05', sales: 2300 },
    { name: '05/05', sales: 2800 },
    { name: '06/05', sales: 1900 },
    { name: '07/05', sales: 3100 },
  ];

  const barberRanking = [
    { id: 1, name: 'Lucas Silva', count: 42, revenue: 2100 },
    { id: 2, name: 'Pedro Alves', count: 35, revenue: 1750 },
    { id: 3, name: 'João Santos', count: 28, revenue: 1400 },
  ];

  const serviceRanking = [
    { id: 1, name: 'Corte Degradê', count: 85, revenue: 4250 },
    { id: 2, name: 'Barba Terapia', count: 45, revenue: 1800 },
    { id: 3, name: 'Corte + Barba', count: 32, revenue: 2560 },
  ];

  const productRanking = [
    { id: 1, name: 'Pomada Matte', count: 18, revenue: 900 },
    { id: 2, name: 'Óleo para Barba', count: 12, revenue: 600 },
  ];

  const clientActivity = [
    { id: 1, name: 'Marcos Paulo', visits: 4, totalSpent: 320 },
    { id: 2, name: 'Felipe Costa', visits: 3, totalSpent: 240 },
    { id: 3, name: 'André Silva', visits: 3, totalSpent: 210 },
  ];

  const sortedRecentSales = [
    { id: 1, createdAt: new Date(2026, 4, 5, 14, 30), clientName: 'Roberto Sousa', items: [{name: 'Corte Degradê'}], total: 50 },
    { id: 2, createdAt: new Date(2026, 4, 5, 15, 0), clientName: 'Carlos Eduardo', items: [{name: 'Corte + Barba'}], total: 90 },
    { id: 3, createdAt: new Date(2026, 4, 5, 15, 45), clientName: 'Thiago Mendes', items: [{name: 'Barba Terapia'}, {name: 'Pomada'}], total: 110 },
  ];

  return (
    <div className="w-full text-foreground bg-background space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 shrink-0 pointer-events-none select-none max-h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 xl:gap-6 p-4 sm:p-6 lg:p-8 rounded-3xl bg-card border border-border shadow-sm shrink-0">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground uppercase">
            Visão Geral <span className="text-primary">Estatística</span>
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground text-[10px] sm:text-sm font-medium">
            <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-primary/70 shrink-0" />
            <span className="whitespace-nowrap">1 Maio</span>
            <ChevronRight className="w-2 h-2 sm:w-3 sm:h-3 opacity-30 shrink-0" />
            <span className="whitespace-nowrap">7 Maio, 2026</span>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
        {[
          { title: 'Faturamento', value: 12450.50, color: 'text-primary', icon: TrendingUp, detail: `184 vendas` },
          { title: 'Despesas', value: 1200.00, color: 'text-rose-500', icon: TrendingDown, detail: `8 lançamentos` },
          { title: 'Comissões', value: 4357.67, color: 'text-purple-500', icon: TrendingDown, detail: `3 barbeiros` },
          { title: 'Lucro Real', value: 6892.83, color: 'text-emerald-500', icon: DollarSign, detail: `Margem: 55.4%` },
          { title: 'Ticket Méd.', value: 67.66, color: 'text-orange-500', icon: UserCheck, detail: `142 clientes` },
        ].map((kpi, i) => (
          <div
            key={kpi.title}
            className={i === 4 ? "col-span-2 md:col-span-1" : ""}
          >
            <Card 
              className={`border-border bg-card shadow-sm rounded-2xl p-4 sm:p-6 group transition-all`}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground line-clamp-1">{kpi.title}</span>
                <div className={`p-1.5 sm:p-2 rounded-lg bg-muted ${kpi.color}`}>
                  <kpi.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-bold tracking-tight text-foreground flex items-center justify-between">
                <div>
                  <span className="text-[10px] sm:text-xs mr-0.5 sm:mr-1 opacity-40 font-medium lowercase">r$</span>
                  {kpi.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-[8px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{kpi.detail}</p>
              </div>
            </Card>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-5 border-border bg-card shadow-sm rounded-3xl overflow-hidden p-4 sm:p-8 min-w-0">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <div>
              <CardTitle className="text-sm sm:text-lg font-bold tracking-tight text-foreground uppercase">Desempenho de Vendas</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">Faturamento acumulado por período</CardDescription>
            </div>
          </div>
          
          <div className="h-[250px] sm:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{top:0, right:0, left:-20, bottom:0}}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }} 
                  tickFormatter={(val) => `R$${val}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Clients */}
        <Card className="lg:col-span-2 border-border bg-card shadow-sm rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="p-4 sm:p-6 lg:p-8 border-b border-border bg-muted/20">
            <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2 sm:gap-3 uppercase tracking-tight">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Melhores Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto scrollbar-thin">
            <div className="divide-y divide-border">
              {clientActivity.map((client, i) => (
                <div key={client.id} className="flex items-center justify-between p-4 sm:p-6 transition-colors hover:bg-muted/30">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-muted flex items-center justify-center text-primary font-bold text-[9px] sm:text-[10px] uppercase shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] sm:text-xs font-bold text-foreground uppercase tracking-tight">{client.name}</span>
                      <span className="text-[8px] sm:text-[9px] text-muted-foreground font-medium uppercase">{client.visits} Visitas</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] sm:text-xs font-bold text-foreground">R$ {client.totalSpent.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
