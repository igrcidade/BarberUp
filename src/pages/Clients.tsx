import React, { useEffect, useState } from 'react';
import { 
  Plus, Pencil, Trash2, Users, Search, History, Eye, UserPlus, 
  Phone, MessageSquare, Calendar as CalendarIcon, Star, TrendingUp,
  MapPin, CheckCircle2, XCircle, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '../lib/db';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/lib/auth';

export default function Clients() {
  const { isActive } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<any>(null);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', notes: '' });

  useEffect(() => {
    const unsubClients = subscribeToCollection('clients', setClients);
    const unsubSales = subscribeToCollection('sales', setSales);
    return () => {
      unsubClients();
      unsubSales();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      await updateDocument('clients', editingClient.id, formData);
    } else {
      await addDocument('clients', { ...formData, lastAttendance: null });
    }
    setIsAddOpen(false);
    setEditingClient(null);
    setFormData({ name: '', phone: '', notes: '' });
  };

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setFormData({ 
      name: client.name, 
      phone: client.phone || '', 
      notes: client.notes || ''
    });
    setIsAddOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este cliente? Todos os registros serão mantidos.')) {
      await deleteDocument('clients', id);
    }
  };

  const getClientStats = (clientId: string) => {
    const clientSales = sales.filter(s => s.clientId === clientId);
    const totalSpent = clientSales.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const lastSale = [...clientSales].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : parseISO(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : parseISO(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    })[0];
    
    let status = 'Inativo';
    let lastDateStr = 'Nunca';
    let lastDateObj: Date | null = null;
    
    if (lastSale) {
      const lastDate = lastSale.createdAt?.toDate ? lastSale.createdAt.toDate() : parseISO(lastSale.createdAt);
      const dayDiff = differenceInDays(new Date(), lastDate);
      status = dayDiff <= 45 ? 'Ativo' : 'Inativo';
      lastDateStr = format(lastDate, 'dd/MM/yyyy');
      lastDateObj = lastDate;
    }

    return { totalSpent, visitCount: clientSales.length, status, lastDateStr, lastDateObj };
  };

  const enrichedClients = clients.map(c => ({
    ...c,
    stats: getClientStats(c.id)
  }));

  const filteredClients = enrichedClients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm)
  ).sort((a, b) => {
    if (!a.stats.lastDateObj && !b.stats.lastDateObj) {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    }
    if (!a.stats.lastDateObj) return 1;
    if (!b.stats.lastDateObj) return -1;
    return b.stats.lastDateObj.getTime() - a.stats.lastDateObj.getTime();
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">
            Gestão de <span className="text-primary">Clientes</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Monitore atendimentos, histórico e retenção da sua base</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            setEditingClient(null);
            setFormData({ name: '', phone: '', notes: '' });
          }
        }}>
          <DialogTrigger render={<Button disabled={!isActive} className="hidden md:flex barber-button-primary h-12 px-8 shadow-md" />}>
            <UserPlus className="w-5 h-5 mr-1" /> NOVO CLIENTE
          </DialogTrigger>
          <DialogContent className="bg-card border-border rounded-3xl p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-8 pb-4 bg-muted/30 border-b border-border">
              <DialogTitle className="text-xl font-bold text-foreground uppercase tracking-tight">
                {editingClient ? 'Editar Perfil' : 'Cadastrar Membro'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs font-medium">Mantenha os dados dos seus clientes sempre atualizados</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Nome Completo</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    required 
                    className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-foreground font-bold"
                    placeholder="Ex: Luan Souza"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">WhatsApp / Telefone</Label>
                  <Input 
                    id="phone" 
                    placeholder="(00) 00000-0000"
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                    className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-foreground font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Observações Privadas</Label>
                  <Input 
                    id="notes" 
                    value={formData.notes} 
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                    placeholder="Preferências de corte, café, etc..."
                    className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-foreground text-sm font-medium"
                  />
                </div>
              </div>
              <DialogFooter className="pt-4 flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl h-12 text-muted-foreground font-bold text-xs uppercase tracking-wider">Cancelar</Button>
                <Button type="submit" className="barber-button-primary px-8 shadow-sm">
                  {editingClient ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR CADASTRO'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
        <div className="lg:col-span-3 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Buscar por nome ou telefone..." 
            className="h-14 pl-12 bg-card border-border rounded-2xl text-base font-medium shadow-sm focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Card className="border-border bg-card rounded-2xl p-4 h-14 flex items-center justify-between border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Base Ativa</span>
          </div>
          <span className="text-xl font-bold text-foreground">
            {clients.length} <span className="text-[9px] text-muted-foreground uppercase ml-1">leads</span>
          </span>
        </Card>
      </div>

      {/* Tabela de Clientes */}
      <Card className="border-border bg-card shadow-sm rounded-3xl overflow-hidden">
        <div className="overflow-x-auto hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border bg-muted/40">
                <TableHead className="pl-8 py-5 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Cliente / Notas</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Fidelidade</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">WhatsApp</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest text-center">Visitas</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Última Visita</TableHead>
                <TableHead className="text-right pr-8 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredClients.map((client, i) => {
                  const stats = client.stats;
                  return (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      key={client.id} 
                      className="group border-border hover:bg-muted/10 transition-all"
                    >
                      <TableCell className="pl-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center font-bold text-primary text-xs uppercase shadow-sm">
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-sm tracking-tight uppercase leading-none mb-1">{client.name}</div>
                            <div className="text-[10px] text-muted-foreground font-medium uppercase max-w-[200px] truncate">{client.notes || 'Sem observações'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${stats.status === 'Ativo' ? 'text-primary border-primary/20 bg-primary/5' : 'text-muted-foreground border-border bg-muted/20'}`}
                        >
                          {stats.status === 'Ativo' ? (
                            <span className="flex items-center gap-1">Ativo</span>
                          ) : (
                            <span className="flex items-center gap-1">Inativo</span>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-bold text-[11px] tracking-tight">
                        <span className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity"><Phone className="w-3 h-3" /> {client.phone || '--'}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center px-2 py-0.5 bg-muted rounded-md border border-border text-[10px] font-bold text-foreground uppercase">
                          {stats.visitCount} <span className="text-[8px] opacity-40 ml-1">x</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-bold text-[11px]">{stats.lastDateStr}</TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                            onClick={() => setViewingClient(client)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-lg"
                            onClick={() => handleEdit(client)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                            onClick={() => handleDelete(client.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex flex-col p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredClients.map((client, i) => {
              const stats = client.stats;
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  key={client.id}
                >
                  <Card className="p-4 border border-border/50 bg-card shadow-sm hover:bg-muted/10 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg uppercase shrink-0">
                          {client.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <h3 className="font-bold text-foreground leading-none mb-1 text-sm uppercase">{client.name}</h3>
                          <span className={`text-[9px] tracking-widest uppercase font-bold ${stats.status === 'Ativo' ? 'text-primary' : 'text-muted-foreground'}`}>
                            {stats.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex bg-muted/50 rounded-lg">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-xl" onClick={() => setViewingClient(client)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted/10 rounded-xl" onClick={() => handleEdit(client)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => handleDelete(client.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/50">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Última Visita</span>
                        <span className="font-bold text-xs">{stats.lastDateStr}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Visitas</span>
                          <span className="font-bold text-xs">{stats.visitCount} x</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        <Button 
          className="md:hidden fixed bottom-[88px] right-4 h-14 w-14 rounded-full shadow-xl z-50 flex items-center justify-center p-0"
          onClick={() => {
            setEditingClient(null);
            setFormData({ name: '', phone: '', email: '', birthDate: '', notes: '' });
            setIsAddOpen(true);
          }}
          disabled={!isActive}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </Card>

      {/* Modal Histórico */}
      <Dialog open={!!viewingClient} onOpenChange={(open) => !open && setViewingClient(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] bg-card border-border rounded-3xl p-0 overflow-hidden flex flex-col shadow-2xl">
          <DialogHeader className="p-8 pb-4 border-b border-border bg-muted/20">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center text-primary font-bold text-2xl uppercase shadow-sm">
                {viewingClient?.name?.charAt(0)}
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold text-foreground uppercase tracking-tight leading-none">
                  {viewingClient?.name}
                </DialogTitle>
                <div className="flex items-center gap-4 text-muted-foreground font-bold text-[10px] uppercase tracking-widest pt-1">
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 opacity-50" /> {viewingClient?.phone || 'Sem contato'}</span>
                  <div className="w-1 h-1 bg-border rounded-full" />
                  <span className="flex items-center gap-1.5 text-primary"><Star className="w-3.5 h-3.5" /> Total R$ {getClientStats(viewingClient?.id).totalSpent.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-10 space-y-6 scrollbar-thin">
            <div className="flex items-center gap-3 mb-4">
              <History className="w-4 h-4 text-primary" />
              <h3 className="text-[10px] font-bold uppercase text-primary tracking-[0.2em]">Histórico de Atendimentos</h3>
            </div>

            {sales.filter(s => s.clientId === viewingClient?.id).sort((a, b) => {
              const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : parseISO(a.createdAt);
              const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : parseISO(b.createdAt);
              return dateB.getTime() - dateA.getTime();
            }).map((sale, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={sale.id} 
                className="relative pl-8 border-l border-border pb-8 last:pb-0"
              >
                <div className="absolute left-[-5px] top-0 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                
                <div className="bg-muted/30 border border-border rounded-2xl p-6 shadow-sm group">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {format(sale.createdAt?.toDate ? sale.createdAt.toDate() : parseISO(sale.createdAt), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                      <Badge variant="ghost" className="text-[8px] uppercase tracking-widest font-bold opacity-40 group-hover:opacity-100 transition-opacity">
                        {sale.paymentMethod}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        {sale.items?.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between border-b border-border border-dashed pb-2 last:border-0 last:pb-0">
                            <span className="text-xs font-bold text-foreground uppercase tracking-tight">{item.name}</span>
                            <span className="text-[10px] font-medium text-muted-foreground uppercase">R$ {item.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col justify-end items-end">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5 opacity-50">Subtotal</span>
                        <div className="text-2xl font-bold text-primary tracking-tight">
                          <span className="text-xs mr-1 font-medium pb-1">R$</span>
                          {sale.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="p-8 pt-4 border-t border-border bg-muted/20 flex justify-end">
            <Button 
              variant="secondary" 
              onClick={() => setViewingClient(null)} 
              className="rounded-xl h-12 px-8 font-bold uppercase text-[10px] tracking-wider"
            >
              Fechar Visualização
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
