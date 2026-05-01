import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, Activity, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function MasterAdmin() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const activeUsers = users.filter(u => u.subscriptionStatus === 'active' || u.subscriptionStatus === 'trial');
  const mrr = users.reduce((acc, curr) => {
    if (curr.subscriptionStatus === 'active') {
      if (curr.subscriptionPlan === 'mensal') return acc + 79.9;
      if (curr.subscriptionPlan === 'semestral') return acc + 69.9;
      if (curr.subscriptionPlan === 'anual') return acc + 59.9;
    }
    return acc;
  }, 0);

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

  if (loading) return <div className="p-8">Carregando painel master...</div>;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold uppercase tracking-tight text-white">Painel Master</h1>
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mt-1">Gestão de Assinantes do SaaS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total de Clientes</p>
              <h3 className="text-2xl font-bold">{users.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-lime-400/10 rounded-2xl text-lime-400">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Clientes Ativos</p>
              <h3 className="text-2xl font-bold">{activeUsers.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">MRR (Recorrência)</p>
              <h3 className="text-2xl font-bold">R$ {mrr.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="uppercase tracking-widest text-xs font-bold text-muted-foreground">Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map(u => (
              <div key={u.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/30 rounded-xl border border-border gap-4">
                <div>
                  <h4 className="font-bold text-sm uppercase">{u.barbershopName || 'Sem Barbearia'}</h4>
                  <p className="text-xs text-muted-foreground">{u.name} - {u.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col text-right">
                    <Badge variant="outline" className={
                      u.subscriptionStatus === 'active' ? 'border-lime-500 text-lime-500' :
                      u.subscriptionStatus === 'trial' ? 'border-orange-500 text-orange-500' :
                      'border-red-500 text-red-500'
                    }>
                      {u.subscriptionStatus === 'active' ? 'Ativo' : u.subscriptionStatus === 'trial' ? 'Teste Grátis' : 'Inativo / Vencido'}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                      Plano: {u.subscriptionPlan || 'N/A'}
                    </span>
                  </div>
                  {u.subscriptionStatus !== 'active' && (
                    <Button variant="outline" size="sm" onClick={() => simulatePaymentUpdate(u.id)} className="text-[10px] uppercase font-bold tracking-widest">
                      <CheckCircle className="w-3 h-3 mr-1" /> Ativar Plano
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {users.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">Nenhum cliente cadastrado.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
