import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, Activity, CheckCircle, Search, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MasterAdmin() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  useEffect(() => {
    if (!isAdmin) return;
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList: any[] = [];
        querySnapshot.forEach((doc) => {
          usersList.push({ id: doc.id, ...doc.data() });
        });
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const simulatePaymentUpdate = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        subscriptionStatus: 'active',
        subscriptionPlan: 'mensal', // default for test
        subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      setUsers(users.map(u => u.id === userId ? { ...u, subscriptionStatus: 'active', subscriptionPlan: 'mensal' } : u));
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchName = (u.name || '').toLowerCase().includes(searchName.toLowerCase()) || 
                      (u.barbershopName || '').toLowerCase().includes(searchName.toLowerCase());
    
    let matchStatus = true;
    if (statusFilter === 'active') matchStatus = u.subscriptionStatus === 'active';
    if (statusFilter === 'inactive') matchStatus = u.subscriptionStatus !== 'active' && u.subscriptionStatus !== 'trial';
    if (statusFilter === 'trial') matchStatus = u.subscriptionStatus === 'trial';

    let matchMonth = true;
    if (monthFilter !== 'all' && u.createdAt) {
      const dateStr = format(new Date(u.createdAt), 'yyyy-MM');
      matchMonth = dateStr === monthFilter;
    }

    return matchName && matchStatus && matchMonth;
  });

  const activeUsers = users.filter(u => u.subscriptionStatus === 'active' || u.subscriptionStatus === 'trial');
  const inactiveUsersCount = users.filter(u => u.subscriptionStatus !== 'active' && u.subscriptionStatus !== 'trial').length;
  
  const mrr = users.reduce((acc, curr) => {
    if (curr.subscriptionStatus === 'active') {
      if (curr.subscriptionPlan === 'mensal') return acc + 79.9;
      if (curr.subscriptionPlan === 'semestral') return acc + 69.9;
      if (curr.subscriptionPlan === 'anual') return acc + 59.9;
    }
    return acc;
  }, 0);

  // Extract unique months for filter
  const monthsSet = new Set<string>();
  users.forEach(u => {
    if (u.createdAt) {
      monthsSet.add(format(new Date(u.createdAt), 'yyyy-MM'));
    }
  });
  const availableMonths = Array.from(monthsSet).sort().reverse();

  if (loading) return <div className="p-8 font-bold uppercase tracking-widest text-primary text-xs">Carregando painel master...</div>;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-white">Painel Master</h1>
        <p className="text-sm font-bold uppercase tracking-widest text-[#009EE3]">Gestão de Assinantes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total (Geral)</p>
              <h3 className="text-2xl font-bold">{users.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-lime-500/10 rounded-2xl text-lime-500">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ativos</p>
              <h3 className="text-2xl font-bold">{activeUsers.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-destructive/10 rounded-2xl text-destructive">
              <Users className="w-6 h-6 border border-destructive border-dashed rounded-full" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vencidos / Cancelados</p>
              <h3 className="text-2xl font-bold">{inactiveUsersCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-[#009EE3]/10 rounded-2xl text-[#009EE3]">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">MRR Total</p>
              <h3 className="text-2xl font-bold">R$ {mrr.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border pb-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <CardTitle className="uppercase tracking-widest text-sm font-bold text-foreground">Relatório de Clientes SaaS</CardTitle>
            
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Nome ou barbearia..." 
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pl-9 h-10 w-full md:w-48 bg-muted/50 border-border text-xs uppercase font-bold tracking-widest"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-full md:w-40 bg-muted/50 border-border text-xs uppercase font-bold tracking-widest">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs uppercase font-bold">Todos Status</SelectItem>
                  <SelectItem value="active" className="text-xs uppercase font-bold">Ativos</SelectItem>
                  <SelectItem value="inactive" className="text-xs uppercase font-bold">Inativos/Vencidos</SelectItem>
                  <SelectItem value="trial" className="text-xs uppercase font-bold">Trial</SelectItem>
                </SelectContent>
              </Select>

              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="h-10 w-full md:w-40 bg-muted/50 border-border text-xs uppercase font-bold tracking-widest">
                  <SelectValue placeholder="Mês Entrada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs uppercase font-bold">Qualquer Mês</SelectItem>
                  {availableMonths.map(m => (
                    <SelectItem key={m} value={m} className="text-xs uppercase font-bold">
                      {format(parseISO(`${m}-01`), 'MMM/yyyy', { locale: ptBR })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredUsers.map(u => (
              <div key={u.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-muted/10 transition-colors gap-4">
                <div className="flex flex-col">
                  <h4 className="font-bold text-sm uppercase text-foreground">{u.barbershopName || 'Sem Nome Adicionado'}</h4>
                  <p className="text-xs text-muted-foreground">{u.name} • {u.email} {u.phone ? `• ${u.phone}` : ''}</p>
                  {u.createdAt && (
                     <span className="text-[10px] uppercase font-bold text-muted-foreground mt-2 inline-flex items-center gap-1 opacity-50">
                       <Filter className="w-3 h-3" />
                       Entrada: {format(new Date(u.createdAt), "dd 'de' MMM, yyyy", { locale: ptBR })}
                     </span>
                  )}
                </div>
                <div className="flex items-center gap-4 md:ml-auto">
                  <div className="flex flex-col text-right">
                    <Badge variant="outline" className={`ml-auto mb-1 ${
                      u.subscriptionStatus === 'active' ? 'border-lime-500 text-lime-500 bg-lime-500/10' :
                      u.subscriptionStatus === 'trial' ? 'border-orange-500 text-orange-500 bg-orange-500/10' :
                      'border-destructive text-destructive bg-destructive/10'
                    }`}>
                      {u.subscriptionStatus === 'active' ? 'Ativo' : u.subscriptionStatus === 'trial' ? 'Trial' : 'Vencido / Inativo'}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      Plano: {u.subscriptionPlan || 'N/A'}
                    </span>
                    {u.subscriptionEnd && (
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        Vence: {format(new Date(u.subscriptionEnd), 'dd/MM/yyyy')}
                      </span>
                    )}
                  </div>
                  {u.subscriptionStatus !== 'active' && (
                    <Button variant="outline" size="sm" onClick={() => simulatePaymentUpdate(u.id)} className="text-[10px] uppercase font-bold tracking-widest hover:text-lime-500 hover:border-lime-500 hover:bg-lime-500/10">
                      <CheckCircle className="w-3 h-3 md:mr-1" /> <span className="hidden md:inline">Ativar Plano (Simulação)</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                <Filter className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">Nenhum cliente encontrado com os filtros atuais.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
