import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  CreditCard,
  ShoppingBag,
  ArrowUpRight,
  UserCheck,
  Scissors,
  Package,
  Calendar as CalendarIcon,
  Filter,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useTheme } from '../components/ThemeProvider';
import { subscribeToCollection, addDocument } from '../lib/db';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, differenceInDays, addDays, subDays, startOfYear, endOfYear, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { motion } from 'motion/react';

export default function Dashboard() {
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filterType, setFilterType] = useState<string>('month');

  useEffect(() => {
    const unsubSales = subscribeToCollection('sales', setSales);
    const unsubExpenses = subscribeToCollection('expenses', setExpenses);
    const unsubClients = subscribeToCollection('clients', setClients);
    const unsubServices = subscribeToCollection('services', setServices);
    const unsubProducts = subscribeToCollection('products', setProducts);

    return () => {
      unsubSales();
      unsubExpenses();
      unsubClients();
      unsubServices();
      unsubProducts();
    };
  }, []);

  const monthStart = parseISO(startDate);
  const monthEnd = parseISO(endDate);

  const currentPeriodSales = sales.filter(s => {
    const sDate = s.createdAt;
    if (!sDate) return false;
    const date = sDate.toDate ? sDate.toDate() : parseISO(sDate);
    return isWithinInterval(date, { start: monthStart, end: monthEnd });
  });

  const currentPeriodExpenses = expenses.filter(e => {
    const eDate = e.date;
    if (!eDate) return false;
    const date = parseISO(eDate);
    return isWithinInterval(date, { start: monthStart, end: monthEnd });
  });

  const totalSales = currentPeriodSales.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalExpenses = currentPeriodExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const profit = totalSales - totalExpenses;
  const clientCount = currentPeriodSales.reduce((acc, curr) => {
    if (curr.clientId) acc.add(curr.clientId);
    return acc;
  }, new Set()).size;

  const ticketMedio = currentPeriodSales.length > 0 ? totalSales / currentPeriodSales.length : 0;

  const { theme } = useTheme();

  // Rankings
  const salesItems = currentPeriodSales.flatMap(s => s.items || []);
  
  const serviceRanking = services.map(service => {
    const items = salesItems.filter(item => item.type === 'service' && (item.id === service.id || item.name === service.name));
    const count = items.length;
    const revenue = items.reduce((acc, curr) => acc + (curr.price || 0), 0);
    return { ...service, count, revenue };
  }).sort((a, b) => b.count - a.count).filter(s => s.count > 0);

  const productRanking = products.map(product => {
    const items = salesItems.filter(item => item.type === 'product' && (item.id === product.id || item.name === product.name));
    const count = items.length;
    const revenue = items.reduce((acc, curr) => acc + (curr.price || 0), 0);
    return { ...product, count, revenue };
  }).sort((a, b) => b.count - a.count).filter(p => p.count > 0);

  const clientActivity = clients.map(client => {
    const visits = currentPeriodSales.filter(s => s.clientId === client.id).length;
    const totalSpent = currentPeriodSales.filter(s => s.clientId === client.id)
      .reduce((acc, curr) => acc + (curr.total || 0), 0);
    return { ...client, visits, totalSpent };
  }).sort((a, b) => b.visits - a.visits).filter(c => c.visits > 0);

  const sortedRecentSales = [...currentPeriodSales].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : parseISO(a.createdAt);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : parseISO(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
  
  // Chart data
  const diffDays = differenceInDays(monthEnd, monthStart) + 1;
  const chartData = Array.from({ length: Math.min(diffDays, 31) }, (_, i) => {
    // If range is large, we group by month or week, but for now we'll do daily for up to 31 days
    const date = addDays(monthStart, i);
    if (date > monthEnd) return null;
    
    const label = format(date, 'dd/MM');
    const daySales = sales.filter(s => {
      const sDate = s.createdAt;
      if (!sDate) return false;
      const parsedDate = sDate.toDate ? sDate.toDate() : parseISO(sDate);
      return format(parsedDate, 'dd/MM/yyyy') === format(date, 'dd/MM/yyyy');
    }).reduce((acc, curr) => acc + (curr.total || 0), 0);
    return { name: label, sales: daySales };
  }).filter(Boolean);

  const setFilter = (type: string) => {
    setFilterType(type);
    const now = new Date();
    switch (type) {
      case 'today':
        setStartDate(format(now, 'yyyy-MM-dd'));
        setEndDate(format(now, 'yyyy-MM-dd'));
        break;
      case 'yesterday':
        setStartDate(format(subDays(now, 1), 'yyyy-MM-dd'));
        setEndDate(format(subDays(now, 1), 'yyyy-MM-dd'));
        break;
      case 'week':
        setStartDate(format(subDays(now, 7), 'yyyy-MM-dd'));
        setEndDate(format(now, 'yyyy-MM-dd'));
        break;
      case 'month':
        setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
      case 'lastMonth':
        setStartDate(format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'));
        break;
      case 'year':
        setStartDate(format(startOfYear(now), 'yyyy-MM-dd'));
        setEndDate(format(endOfYear(now), 'yyyy-MM-dd'));
        break;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-8 rounded-3xl bg-card border border-border shadow-sm">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">
            Visão Geral <span className="text-primary">Estatística</span>
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <CalendarIcon className="w-4 h-4 text-primary/70" />
            <span>{format(monthStart, 'd MMMM', { locale: ptBR })}</span>
            <ChevronRight className="w-3 h-3 opacity-30" />
            <span>{format(monthEnd, 'd MMMM, yyyy', { locale: ptBR })}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border">
            {[
              { id: 'today', label: 'Hoje' },
              { id: 'week', label: '7 Dias' },
              { id: 'month', label: 'Mês' },
              { id: 'lastMonth', label: 'Ant.' },
              { id: 'year', label: 'Ano' },
            ].map(f => (
              <Button 
                key={f.id}
                variant={filterType === f.id ? 'secondary' : 'ghost'} 
                size="sm" 
                className={`h-8 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </Button>
            ))}
            <div className="flex items-center gap-2 px-2 border-l border-border ml-2">
              <Input 
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setFilterType('custom');
                }}
                className="h-8 text-[10px] uppercase font-bold w-auto bg-card rounded-md border-border"
              />
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Até</span>
              <Input 
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setFilterType('custom');
                }}
                className="h-8 text-[10px] uppercase font-bold w-auto bg-card rounded-md border-border"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Faturamento', value: totalSales, color: 'text-primary', icon: TrendingUp, detail: `${currentPeriodSales.length} vendas` },
          { title: 'Despesas', value: totalExpenses, color: 'text-rose-500', icon: TrendingDown, detail: `${currentPeriodExpenses.length} lançamentos` },
          { title: 'Lucro Real', value: profit, color: 'text-emerald-500', icon: DollarSign, detail: `Margem: ${totalSales > 0 ? ((profit / totalSales) * 100).toFixed(1) : 0}%` },
          { title: 'Ticket Médio', value: ticketMedio, color: 'text-orange-500', icon: UserCheck, detail: `${clientCount} clientes` },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-border bg-card shadow-sm rounded-2xl p-6 group transition-all hover:border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{kpi.title}</span>
                <div className={`p-2 rounded-lg bg-muted ${kpi.color}`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                <span className="text-xs mr-1 opacity-40 font-medium lowercase">r$</span>
                {kpi.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium mt-2 uppercase tracking-wide">{kpi.detail}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-5 border-border bg-card shadow-sm rounded-3xl overflow-hidden p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-foreground uppercase">Desempenho de Vendas</CardTitle>
              <CardDescription className="text-xs">Faturamento acumulado por período</CardDescription>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
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
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderRadius: '16px', 
                    border: '1px solid hsl(var(--border))', 
                    boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                    padding: '12px'
                  }}
                  itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 700, fontSize: '12px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '4px' }}
                  formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Vendas']}
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
          <CardHeader className="p-8 border-b border-border bg-muted/20">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-3 uppercase tracking-tight">
              <Users className="w-5 h-5 text-primary" />
              Melhores Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto scrollbar-thin">
            <div className="divide-y divide-border">
              {clientActivity.slice(0, 5).map((client, i) => (
                <div key={client.id} className="flex items-center justify-between p-6 transition-colors hover:bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-primary font-bold text-[10px] uppercase">
                      {i + 1}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground uppercase tracking-tight">{client.name}</span>
                      <span className="text-[9px] text-muted-foreground font-medium uppercase">{client.visits} Visitas</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-foreground">R$ {client.totalSpent.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="p-4 bg-muted/10 border-t border-border">
            <Button variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary">
              Detalhes do Ranking
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Services High */}
        <Card className="border-border bg-card shadow-sm rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Scissors className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-foreground uppercase tracking-tight">Categorias de Serviço</h3>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                Total: R$ {serviceRanking.reduce((acc, curr) => acc + curr.revenue, 0).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="space-y-6">
            {serviceRanking.slice(0, 4).map((s) => (
              <div key={s.id} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-foreground uppercase tracking-tight">{s.name}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-primary uppercase">{s.count} atendimentos</span>
                    <span className="text-[10px] text-muted-foreground font-bold tracking-wider">R$ {s.revenue.toFixed(2)}</span>
                  </div>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden mt-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(s.count / (serviceRanking[0]?.count || 1)) * 100}%` }}
                    className="bg-primary h-full rounded-full" 
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Product Sales */}
        <Card className="border-border bg-card shadow-sm rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-secondary/30 rounded-xl">
              <Package className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-foreground uppercase tracking-tight">Vendas de Balcão</h3>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                Total: R$ {productRanking.reduce((acc, curr) => acc + curr.revenue, 0).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="space-y-6">
            {productRanking.slice(0, 4).map((p) => (
              <div key={p.id} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-foreground uppercase tracking-tight">{p.name}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-secondary-foreground uppercase">{p.count} unidades</span>
                    <span className="text-[10px] text-muted-foreground font-bold tracking-wider">R$ {p.revenue.toFixed(2)}</span>
                  </div>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden mt-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(p.count / (productRanking[0]?.count || 1)) * 100}%` }}
                    className="bg-secondary h-full rounded-full" 
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Analytical Table */}
      <Card className="border-border bg-card shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="p-8 border-b border-border bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-muted rounded-xl ring-1 ring-border">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground uppercase tracking-tight">Extrato Recente</CardTitle>
            </div>
            <Button size="sm" className="rounded-lg text-[10px] font-bold uppercase tracking-widest px-6 h-10">Exportar Logs</Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-transparent">
                <TableHead className="w-40 pl-8 text-[10px] font-bold uppercase text-muted-foreground py-4 tracking-widest">Data</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground py-4 tracking-widest">Cliente</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground py-4 tracking-widest">Procedimentos</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground py-4 tracking-widest text-right pr-8">Faturamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecentSales.slice(0, 10).map((sale) => {
                const sDate = sale.createdAt;
                if (!sDate) return null;
                const date = sDate.toDate ? sDate.toDate() : parseISO(sale.createdAt);
                return (
                  <TableRow key={sale.id} className="border-border hover:bg-muted/20 transition-colors">
                    <TableCell className="text-[11px] font-bold text-muted-foreground pl-8 py-5 uppercase">
                      {format(date, 'dd/MM HH:mm')}
                    </TableCell>
                    <TableCell className="font-bold text-foreground py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-[9px] uppercase">
                          {sale.clientName?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs uppercase tracking-tight">{sale.clientName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex gap-2 flex-wrap">
                        {sale.items?.slice(0, 2).map((item: any, idx: number) => (
                          <Badge key={idx} variant="outline" className={`text-[8px] font-bold px-2 py-0 border-border text-muted-foreground uppercase`}>
                            {item.name}
                          </Badge>
                        ))}
                        {sale.items?.length > 2 && <span className="text-[9px] font-bold text-primary">+{sale.items.length - 2}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-right text-sm text-foreground py-5 pr-8 tracking-tight">
                      <span className="text-[10px] text-primary mr-1 font-medium pb-1">R$</span>
                      {sale.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
