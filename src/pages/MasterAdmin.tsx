import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, onSnapshot, writeBatch, query, where } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, Activity, CheckCircle, Search, Filter, Trash2, AlertTriangle, ShieldCheck, Mail, Phone, Calendar, Clock, Key, Settings, UserPlus, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function MasterAdmin() {
  const { user: adminUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  
  // Detalhes do Usuário Selecionado
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editUserForm, setEditUserForm] = useState<any>({});
  const [selectedExtension, setSelectedExtension] = useState<number | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [newTempPassword, setNewTempPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (selectedUser) {
      setEditUserForm({
        name: selectedUser.name || '',
        barbershopName: selectedUser.barbershopName || '',
        phone: selectedUser.phone || '',
        subscriptionPlan: selectedUser.subscriptionPlan || 'mensal',
        subscriptionStatus: selectedUser.subscriptionStatus || 'trial',
        subscriptionEnd: selectedUser.subscriptionEnd || ''
      });
      setSelectedExtension(null);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!isAdmin) return;
    
    console.log("[MasterAdmin] Inicianco sincronização em tempo real para:", adminUser?.email);
    setErrorMsg('');

    // Sincronização em Tempo Real da Base de Usuários
    const unsubscribe = onSnapshot(collection(db, 'users'), (querySnapshot) => {
      console.log(`[MasterAdmin] Snapshot recebido com ${querySnapshot.size} usuários`);
      const usersList: any[] = [];
      querySnapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() });
      });
      
      const getTimestamp = (val: any) => {
        if (!val) return 0;
        if (typeof val === 'string') return new Date(val).getTime();
        // Handle Firestore Timestamp
        if (val && typeof val === 'object' && 'seconds' in val) return val.seconds * 1000;
        if (val instanceof Date) return val.getTime();
        return 0;
      };

      setUsers(usersList.sort((a, b) => {
        const dateA = getTimestamp(a.createdAt);
        const dateB = getTimestamp(b.createdAt);
        return dateB - dateA;
      }));
      setLoading(false);
      setErrorMsg('');
    }, (error) => {
      console.error("[MasterAdmin] Erro na sincronização:", error);
      setErrorMsg(`Erro de Permissão: ${error.message}`);
      toast.error('Erro ao sincronizar lista de usuários. Verifique as permissões de administrador.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin, adminUser]);

  if (!isAdmin) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const handleUpdateUserStatus = async (userId: string, data: any) => {
    try {
      await updateDoc(doc(db, 'users', userId), data);
      setUsers(users.map(u => u.id === userId ? { ...u, ...data } : u));
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar usuário.');
    }
  };

  const handleExtendAccess = async (days: number) => {
    if (!selectedUser) return;
    
    setSelectedExtension(days);

    // Calcula nova data baseado na data atual ou na data de expiração original se ela for futura
    const currentEnd = selectedUser.subscriptionEnd ? new Date(selectedUser.subscriptionEnd) : new Date();
    const referenceDate = currentEnd > new Date() ? currentEnd : new Date();
    const newEnd = addDays(referenceDate, days);

    setEditUserForm({
       ...editUserForm,
       subscriptionStatus: 'trial',
       subscriptionEnd: newEnd.toISOString()
    });
  };

  const handleZeroAccess = () => {
    if (!selectedUser) return;
    
    setSelectedExtension(0);

    setEditUserForm({
       ...editUserForm,
       subscriptionStatus: 'trial',
       subscriptionEnd: new Date().toISOString()
    });
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newTempPassword) return;
    
    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedUser.email,
          newPassword: newTempPassword,
          adminEmail: adminUser?.email
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Senha de ${selectedUser.email} resetada com sucesso!`);
        setIsResetPasswordOpen(false);
        setNewTempPassword('');
      } else {
        toast.error(data.error || 'Erro ao resetar senha.');
      }
    } catch (error) {
      toast.error('Falha na comunicação com o servidor.');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || !adminUser) return;
    const { id: userId, email } = userToDelete;
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email,
          adminEmail: adminUser.email
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Conta ${email} e seus dados removidos com sucesso.`);
        setUserToDelete(null);
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        toast.error(data.error || 'Erro ao remover usuário.');
      }
    } catch (e: any) {
      console.error('Erro ao deletar usuário:', e);
      toast.error('Erro ao remover usuário. Verifique as permissões.');
    } finally {
      setLoading(false);
    }
  };

  const masters = ['igor.cidade@hotmail.com', 'igrcidade@gmail.com'];
  const validUsers = users.filter(u => !masters.includes(u.email?.toLowerCase()));

  const activeCount = validUsers.filter(u => u.subscriptionStatus === 'active').length;
  const trialCount = validUsers.filter(u => u.subscriptionStatus === 'trial').length;
  const expiredCount = validUsers.filter(u => u.subscriptionStatus === 'expired' || u.subscriptionStatus === 'blocked').length;
  
  // Taxa de Conversão: Quantos usuários totais se tornaram pagantes
  const conversionRate = validUsers.length > 0 
    ? ((activeCount / validUsers.length) * 100).toFixed(1) 
    : "0";
    
  // Taxa de Churn Estimada: Proporção de usuários que expiraram em relação à base total histórica
  const churnRate = (activeCount + expiredCount) > 0
    ? ((expiredCount / (activeCount + expiredCount)) * 100).toFixed(1)
    : "0";

  const mrr = validUsers.reduce((acc, curr) => {
    if (curr.subscriptionStatus === 'active') {
      if (curr.subscriptionPlan === 'mensal') return acc + 79.9;
      if (curr.subscriptionPlan === 'semestral') return acc + 69.9;
      if (curr.subscriptionPlan === 'anual') return acc + 59.9;
    }
    return acc;
  }, 0);

  const filteredUsers = validUsers.filter((u) => {
    const matchName = (u.name || '').toLowerCase().includes(searchName.toLowerCase()) || 
                      (u.barbershopName || '').toLowerCase().includes(searchName.toLowerCase()) ||
                      (u.email || '').toLowerCase().includes(searchName.toLowerCase());
    
    let matchStatus = true;
    if (statusFilter === 'active') matchStatus = u.subscriptionStatus === 'active';
    if (statusFilter === 'trial') matchStatus = u.subscriptionStatus === 'trial';
    if (statusFilter === 'inactive') matchStatus = u.subscriptionStatus === 'expired' || u.subscriptionStatus === 'blocked';

    return matchName && matchStatus;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Activity className="w-10 h-10 text-primary animate-pulse" />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Sincronizando Command Center...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto mb-20 lg:mb-0">
      {/* Header Profissional */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-2 text-sm font-bold w-full mb-4">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>{errorMsg} - Admin Email: {adminUser?.email}</p>
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">ADMIN COMMAND</h1>
            <Badge variant="outline" className="border-primary text-primary bg-primary/5 uppercase font-bold text-[10px] tracking-widest px-3 py-1">Proprietário SaaS</Badge>
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#009EE3]">Gestão Global de Assinantes</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={async () => {
              setLoading(true);
              try {
                const snap = await getDocs(collection(db, 'users'));
                const usersList: any[] = [];
                snap.forEach((doc) => {
                  usersList.push({ id: doc.id, ...doc.data() });
                });
                const getTimestamp = (val: any) => {
                  if (!val) return 0;
                  if (typeof val === 'string') return new Date(val).getTime();
                  if (val && typeof val === 'object' && 'seconds' in val) return val.seconds * 1000;
                  if (val instanceof Date) return val.getTime();
                  return 0;
                };
                setUsers(usersList.sort((a, b) => {
                  const dateA = getTimestamp(a.createdAt);
                  const dateB = getTimestamp(b.createdAt);
                  return dateB - dateA;
                }));
                toast.success('Base de dados sincronizada com sucesso!');
              } catch (e) {
                console.error(e);
                toast.error('Falha ao forçar sincronização.');
              } finally {
                setLoading(false);
              }
            }} 
            className="flex-1 md:flex-none h-11 rounded-xl bg-card border-border uppercase font-bold text-[10px] tracking-widest hover:border-primary transition-all gap-2"
          >
            <Activity className="w-4 h-4" /> Forçar Sincronização
          </Button>
        </div>
      </div>

      {/* Grid de Métricas de Negócio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card className="bg-card border-border shadow-xl">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Base Total</p>
            <h3 className="text-2xl font-black">{validUsers.length}</h3>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xl">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase text-lime-500 mb-1 tracking-widest">Pagantes Ativos</p>
            <h3 className="text-2xl font-black text-lime-500">{activeCount}</h3>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xl">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase text-orange-500 mb-1 tracking-widest">Em Trial</p>
            <h3 className="text-2xl font-black text-orange-500">{trialCount}</h3>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xl">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase text-destructive mb-1 tracking-widest">Inadimplentes</p>
            <h3 className="text-2xl font-black text-destructive">{expiredCount}</h3>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xl">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase text-primary mb-1 tracking-widest">Conversão</p>
            <h3 className="text-2xl font-black">{conversionRate}%</h3>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xl">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase text-red-500 mb-1 tracking-widest">Churn Rate</p>
            <h3 className="text-2xl font-black">{churnRate}%</h3>
          </CardContent>
        </Card>
      </div>

      {/* Indicador de Receita Centralizado */}
      <Card className="bg-[#009EE3]/10 border border-[#009EE3]/30 shadow-2xl overflow-hidden rounded-3xl">
        <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-[#009EE3]/20 rounded-2xl flex items-center justify-center text-[#009EE3] shadow-lg">
              <DollarSign className="w-8 h-8 font-black" />
            </div>
            <div>
              <p className="text-xs font-black text-[#009EE3] uppercase tracking-[0.3em] mb-1">Faturamento Mensal (MRR)</p>
              <h2 className="text-4xl font-black text-white tracking-tighter">
                R$ {mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
            </div>
          </div>
          <div className="text-right flex flex-col gap-1 items-end">
             <Badge className="bg-[#009EE3] text-white px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest">SAAS HEALTH: EXCELLENT</Badge>
             <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2 tracking-widest">Baseado na média mensal por plano ativo</p>
          </div>
        </CardContent>
      </Card>

      {/* Gestão de Clientes */}
      <Card className="bg-card border-border shadow-2xl overflow-hidden rounded-3xl border-none">
        <CardHeader className="bg-muted/30 border-b border-border/50 p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div className="space-y-1">
              <CardTitle className="uppercase tracking-[0.2em] text-xs font-black text-foreground flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                CENTRAL DE OPERAÇÕES
              </CardTitle>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Gerenciamento completo da base de clientes</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Nome, Email ou Barbearia..." 
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pl-10 h-11 w-full md:w-80 bg-muted/50 border-border text-xs uppercase font-bold tracking-widest rounded-xl focus:ring-primary/20"
                />
              </div>

              <Select value={statusFilter || "all"} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 w-full md:w-44 bg-muted/50 border-border text-xs uppercase font-bold tracking-widest rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs uppercase font-bold">Todos</SelectItem>
                  <SelectItem value="active" className="text-xs uppercase font-bold">Ativos</SelectItem>
                  <SelectItem value="trial" className="text-xs uppercase font-bold">Em Trial</SelectItem>
                  <SelectItem value="inactive" className="text-xs uppercase font-bold">Inadimplentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {filteredUsers.map(u => (
              <div key={u.id} className="group p-6 md:px-8 md:py-6 hover:bg-primary/[0.02] transition-all flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  <div className="h-12 w-12 rounded-2xl bg-muted/50 border border-border flex items-center justify-center flex-shrink-0 group-hover:border-primary/30 transition-all">
                    <span className="text-lg font-black text-muted-foreground group-hover:text-primary">{u.barbershopName?.charAt(0) || 'B'}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-black text-sm uppercase text-foreground truncate max-w-[200px]">{u.barbershopName || 'Sem Nome'}</h4>
                      <Badge variant="outline" className={`text-[8px] uppercase px-2 py-0 h-5 font-bold tracking-[0.1em] ${
                        u.subscriptionStatus === 'active' ? 'border-lime-500 text-lime-500 bg-lime-500/10' :
                        u.subscriptionStatus === 'trial' ? 'border-orange-500 text-orange-500 bg-orange-500/10' :
                        u.subscriptionStatus === 'blocked' ? 'border-red-500 text-red-500 bg-red-500/10' :
                        'border-destructive text-destructive bg-destructive/10'
                      }`}>
                        {u.subscriptionStatus === 'active' ? 'PAGANTE' : 
                         u.subscriptionStatus === 'trial' ? 'TRIAL' : 
                         u.subscriptionStatus === 'blocked' ? 'BLOQUEADO' : 'EXPIRADO'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-medium uppercase tracking-widest">
                       <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-primary/50" />{u.email}</span>
                       {u.phone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-primary/50" />{u.phone}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-10 md:text-right flex-shrink-0">
                  <div className="hidden lg:flex flex-col gap-1 items-end">
                    <p className="text-[9px] font-black tracking-widest text-muted-foreground uppercase opacity-50">Assinatura</p>
                    <p className="text-xs font-black uppercase text-foreground">{u.subscriptionPlan || 'N/A'}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end min-w-[120px]">
                    <p className="text-[9px] font-black tracking-widest text-muted-foreground uppercase opacity-50">Vigência até</p>
                    <p className={`text-xs font-black uppercase ${
                      u.subscriptionStatus === 'active' ? 'text-lime-500' : 'text-orange-500'
                    }`}>
                      {u.subscriptionEnd ? format(new Date(u.subscriptionEnd), 'dd/MM/yyyy') : '---'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedUser(u)} 
                      className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-border hover:border-primary hover:text-primary transition-all"
                    >
                      GERENCIAR
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setUserToDelete(u)}
                      className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Gestão Holística do Cliente */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-4xl bg-card border-none rounded-3xl p-0 overflow-hidden shadow-3xl flex flex-col">
          {selectedUser && (
            <div className="flex flex-col h-full max-h-[95vh] overflow-y-auto">
              {/* Header do Modal com Avatar e Stats */}
              <div className="p-6 sm:p-8 sm:pb-6 bg-muted/30 border-b border-border flex flex-col sm:flex-row items-start sm:justify-between gap-4">
                <div className="flex gap-6 items-center sm:items-start">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-3xl sm:text-4xl font-black text-primary shadow-2xl shrink-0">
                    {selectedUser.barbershopName?.charAt(0)}
                  </div>
                  <div className="flex flex-col gap-1 pt-1 sm:pt-2 min-w-0">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-black uppercase tracking-tight text-white truncate max-w-full">{selectedUser.barbershopName}</h2>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
                       <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-primary shrink-0" /> <span className="truncate">{selectedUser.email}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className={editUserForm.subscriptionStatus === 'active' ? 'bg-lime-500 text-black' : editUserForm.subscriptionStatus === 'blocked' ? 'bg-destructive text-white' : 'bg-orange-500 text-black'}>
                        {editUserForm.subscriptionStatus === 'active' ? 'ASSINATURA ATIVA' : editUserForm.subscriptionStatus === 'blocked' ? 'CONTA BLOQUEADA' : 'PERÍODO EXPERIMENTAL'}
                      </Badge>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Criado em: {selectedUser.createdAt ? format(new Date(selectedUser.createdAt), "dd/MM/yyyy") : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Módulo de Ações e Edição */}
              <div className="p-8 space-y-8 overflow-y-auto">
                
                {/* 1. Edição de Dados Cadastrais */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                    <Settings className="w-4 h-4" /> DADOS E CONFIGURAÇÃO
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Proprietário / Responsável</Label>
                      <Input 
                        value={editUserForm.name || ''} 
                        onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                        className="h-11 bg-muted/20 border-border rounded-xl font-black uppercase text-xs focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nome Fantasia (Barbearia)</Label>
                      <Input 
                        value={editUserForm.barbershopName || ''} 
                        onChange={(e) => setEditUserForm({ ...editUserForm, barbershopName: e.target.value })}
                        className="h-11 bg-muted/20 border-border rounded-xl font-black uppercase text-xs focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Contato Telefônico</Label>
                      <Input 
                        value={editUserForm.phone || ''} 
                        onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                        className="h-11 bg-muted/20 border-border rounded-xl font-black uppercase text-xs focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Vincular Plano</Label>
                      <Select 
                        value={editUserForm.subscriptionPlan || 'mensal'} 
                        onValueChange={(val) => setEditUserForm({ ...editUserForm, subscriptionPlan: val })}
                      >
                        <SelectTrigger className="h-11 bg-muted/20 border-border rounded-xl font-black uppercase text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="mensal" className="text-xs font-bold uppercase">PLANO MENSAL</SelectItem>
                          <SelectItem value="semestral" className="text-xs font-bold uppercase">PLANO SEMESTRAL</SelectItem>
                          <SelectItem value="anual" className="text-xs font-bold uppercase">PLANO ANUAL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 2. Controle de Liberação (Dias Grátis) */}
                <div className="space-y-4 pt-6 border-t border-border/50">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#009EE3] flex items-center gap-2">
                    <Clock className="w-4 h-4" /> CONCEDER ACESSO MANUAL
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => handleZeroAccess()} className={`rounded-xl h-11 px-6 font-black text-[10px] tracking-widest ${selectedExtension === 0 ? 'barber-button-primary border-transparent text-white' : 'border-border bg-muted/10 hover:border-orange-500 hover:text-orange-500'}`}>ZERAR DIAS</Button>
                    <Button variant="outline" onClick={() => handleExtendAccess(7)} className={`rounded-xl h-11 px-6 font-black text-[10px] tracking-widest ${selectedExtension === 7 ? 'barber-button-primary border-transparent text-white' : 'border-border bg-muted/10 hover:border-[#009EE3] hover:text-[#009EE3]'}`}>+ 07 DIAS</Button>
                    <Button variant="outline" onClick={() => handleExtendAccess(15)} className={`rounded-xl h-11 px-6 font-black text-[10px] tracking-widest ${selectedExtension === 15 ? 'barber-button-primary border-transparent text-white' : 'border-border bg-muted/10 hover:border-[#009EE3] hover:text-[#009EE3]'}`}>+ 15 DIAS</Button>
                    <Button variant="outline" onClick={() => handleExtendAccess(30)} className={`rounded-xl h-11 px-6 font-black text-[10px] tracking-widest ${selectedExtension === 30 ? 'barber-button-primary border-transparent text-white' : 'border-border bg-muted/10 hover:border-[#009EE3] hover:text-[#009EE3]'}`}>+ 30 DIAS</Button>
                    <Button variant="outline" onClick={() => handleExtendAccess(365)} className={`rounded-xl h-11 px-6 font-black text-[10px] tracking-widest ${selectedExtension === 365 ? 'barber-button-primary border-transparent text-white' : 'border-border bg-muted/10 hover:border-lime-500 hover:text-lime-500'}`}>+ 365 DIAS (ANUAL)</Button>
                  </div>
                </div>

                {/* 3. Status de Conta e Bloqueios */}
                <div className="space-y-4 pt-6 border-t border-border/50">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-destructive flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> SEGURANÇA E RETENÇÃO
                  </h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-5 bg-destructive/5 border border-destructive/20 rounded-2xl">
                       <div className="space-y-1">
                          <p className="text-sm font-black text-white uppercase tracking-tight">Bloqueio de Acesso</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Impede qualquer interação com o sistema imediatamente</p>
                       </div>
                       <Button 
                         variant={editUserForm.subscriptionStatus === 'blocked' ? 'default' : 'outline'}
                         onClick={() => setEditUserForm({ ...editUserForm, subscriptionStatus: editUserForm.subscriptionStatus === 'blocked' ? (selectedUser.subscriptionEnd && new Date(selectedUser.subscriptionEnd) > new Date() ? 'active' : 'trial') : 'blocked' })}
                         className={`rounded-xl h-11 px-8 font-black text-[10px] tracking-widest transition-all ${
                            editUserForm.subscriptionStatus === 'blocked' 
                            ? 'bg-lime-500 text-black hover:bg-lime-600' 
                            : 'border-destructive text-destructive hover:bg-destructive hover:text-white'
                         }`}
                       >
                         {editUserForm.subscriptionStatus === 'blocked' ? 'REATIVAR CLIENTE' : 'BLOQUEAR CLIENTE'}
                       </Button>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-card border border-border rounded-2xl">
                       <div className="space-y-1">
                          <p className="text-sm font-black text-white uppercase tracking-tight">Reposição de Credenciais</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Resetar senha do cliente para acesso padrão</p>
                       </div>
                       <Button variant="outline" onClick={() => setIsResetPasswordOpen(true)} className="rounded-xl h-11 border-border hover:border-primary hover:text-primary px-8 font-black text-[10px] tracking-widest transition-all">
                         GERAR NOVA SENHA
                       </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer de Encerramento */}
              <div className="p-8 bg-muted/30 border-t border-border flex justify-end gap-4">
                <Button variant="ghost" onClick={() => setSelectedUser(null)} className="h-12 px-8 rounded-xl uppercase font-black text-[11px] tracking-[0.2em] text-muted-foreground hover:bg-muted/20 transition-all">
                   CANCELAR
                </Button>
                <Button 
                  onClick={() => {
                    handleUpdateUserStatus(selectedUser.id, editUserForm);
                    setSelectedUser(null);
                  }} 
                  className="barber-button-primary h-12 px-8 rounded-xl font-black tracking-widest uppercase"
                >
                   CONFIRMAR ALTERAÇÕES
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Reset de Senha (Confirm) */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="max-w-md bg-card border-none rounded-3xl p-8 shadow-4xl">
          <DialogHeader className="space-y-3">
             <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-2">
                <Key className="w-6 h-6" />
             </div>
            <DialogTitle className="text-2xl font-black uppercase text-foreground tracking-tighter">RESET DE ACESSO</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Insira a senha temporária para {selectedUser?.email}. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-8 space-y-4">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-[0.2em]">NOVA SENHA ALFANUMÉRICA *</Label>
              <Input 
                type="text"
                placeholder="Ex: BarbeiroUp@2024"
                value={newTempPassword}
                onChange={(e) => setNewTempPassword(e.target.value)}
                className="h-14 bg-muted/30 border-border rounded-xl font-mono text-xl tracking-[0.2em] focus:ring-primary/20"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-4">
             <Button variant="ghost" onClick={() => setIsResetPasswordOpen(false)} className="rounded-xl h-12 uppercase font-black text-[10px] tracking-widest flex-1">CANCELAR</Button>
             <Button onClick={handleResetPassword} disabled={!newTempPassword} className="barber-button-primary h-12 flex-[2] rounded-xl font-black tracking-widest uppercase">
                CONCLUIR RESET
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão de Usuário (Confirm) */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent className="max-w-md bg-card border-none rounded-3xl p-8 shadow-4xl">
          <DialogHeader className="space-y-3">
             <div className="h-12 w-12 bg-destructive/10 rounded-xl flex items-center justify-center text-destructive mb-2">
                <Trash2 className="w-6 h-6" />
             </div>
            <DialogTitle className="text-2xl font-black uppercase text-foreground tracking-tighter">EXCLUIR USUÁRIO</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              TEM CERTEZA? Esta ação irá deletar PERMANENTEMENTE a conta <strong>{userToDelete?.email}</strong> e todos os seus dados vinculados (clientes, finanças, etc). Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-4 mt-8">
             <Button variant="ghost" onClick={() => setUserToDelete(null)} className="rounded-xl h-12 uppercase font-black text-[10px] tracking-widest flex-1">CANCELAR</Button>
             <Button onClick={handleDeleteUser} disabled={loading} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-12 flex-[2] rounded-xl font-black tracking-widest uppercase">
                {loading ? 'EXCLUINDO...' : 'CONCLUIR EXCLUSÃO'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
