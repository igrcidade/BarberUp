import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Users, Search, Edit2, Mail, Scissors, User as UserIcon, Trash2 } from 'lucide-react';
import { addDocument, updateDocument, subscribeToCollection } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export default function Barbers() {
  const { user, isActive } = useAuth();
  const [barbers, setBarbers] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', email: '', commissionService: '50', commissionProduct: '10', active: true });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    return subscribeToCollection('barbers', setBarbers);
  }, []);

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.commissionService || !formData.commissionProduct) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const data = {
      name: formData.name,
      email: formData.email,
      commissionService: Number(formData.commissionService),
      commissionProduct: Number(formData.commissionProduct),
      commission: Number(formData.commissionService), // Backward compatibility
      active: formData.active,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingBarber) {
        await updateDocument('barbers', editingBarber.id, data);
        toast.success('Barbeiro atualizado com sucesso!');
      } else {
        await addDocument('barbers', {
          ...data,
          createdAt: new Date().toISOString(),
        });
        toast.success('Barbeiro adicionado com sucesso!');
      }
      setIsOpen(false);
      setEditingBarber(null);
      setFormData({ name: '', email: '', commissionService: '50', commissionProduct: '10', active: true });
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar barbeiro');
    }
  };

  const handleEdit = (barber: any) => {
    setEditingBarber(barber);
    setFormData({
      name: barber.name,
      email: barber.email || '',
      commissionService: barber.commissionService?.toString() || barber.commission?.toString() || '0',
      commissionProduct: barber.commissionProduct?.toString() || '0',
      active: barber.active ?? true,
    });
    setIsOpen(true);
  };

  const filteredBarbers = barbers.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.email && b.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Gestão de Barbeiros</h1>
          <p className="text-muted-foreground font-medium mt-1">Gerencie a equipe e porcentagens de comissão.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingBarber(null);
            setFormData({ name: '', email: '', commissionService: '50', commissionProduct: '10', active: true });
          }
        }}>
          <DialogTrigger render={<Button disabled={!isActive} className="hidden md:flex barber-button-primary h-12 px-8 shadow-md" />}>
            <Plus className="w-5 h-5 mr-1" /> NOVO BARBEIRO
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border/50">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-foreground">
                {editingBarber ? 'Editar Barbeiro' : 'Novo Barbeiro'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Nome Completo</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Ex: João Silva" 
                      className="pl-11 h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-foreground font-bold text-sm"
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="email"
                      placeholder="joao@exemplo.com" 
                      className="pl-11 h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-foreground font-bold text-sm"
                      value={formData.email} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Com. Serviços (%)</Label>
                    <Input 
                      type="number"
                      placeholder="50" 
                      className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-foreground font-bold text-sm"
                      value={formData.commissionService} 
                      onChange={(e) => setFormData({ ...formData, commissionService: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Com. Produtos (%)</Label>
                    <Input 
                      type="number"
                      placeholder="10" 
                      className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-foreground font-bold text-sm"
                      value={formData.commissionProduct} 
                      onChange={(e) => setFormData({ ...formData, commissionProduct: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-foreground">Status Módulo</Label>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Barbeiro Ativo</p>
                  </div>
                  <Switch 
                    checked={formData.active} 
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })} 
                  />
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full h-12 rounded-xl barber-button-primary font-black uppercase tracking-wider text-sm shadow-md">
                Salvar Barbeiro
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-card p-2 rounded-2xl border border-border/50 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar barbeiros..." 
            className="pl-11 h-12 bg-transparent border-none focus-visible:ring-0 text-foreground font-medium text-sm placeholder:text-muted-foreground"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="bg-card border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 text-xs uppercase font-bold tracking-widest text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-6 py-4">Barbeiro</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4 text-center">Comissão (Serviço/Produto)</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredBarbers.map((barber) => (
                <tr key={barber.id} className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Scissors className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-foreground">{barber.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {barber.email || '-'}
                  </td>
                  <td className="px-6 py-4 text-center space-x-2">
                    <span title="Comissão de Serviço" className="inline-flex items-center gap-1 py-1 px-2.5 rounded-md bg-orange-500/10 text-orange-500 font-bold text-xs">
                      <span className="text-[9px] uppercase tracking-wider opacity-70">Serv:</span> {barber.commissionService || barber.commission || 0}%
                    </span>
                    <span title="Comissão de Produto" className="inline-flex items-center gap-1 py-1 px-2.5 rounded-md bg-orange-500/10 text-orange-500 font-bold text-xs">
                      <span className="text-[9px] uppercase tracking-wider opacity-70">Prod:</span> {barber.commissionProduct || 0}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex py-1 px-2.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${barber.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                      {barber.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-xs font-bold text-muted-foreground hover:text-foreground"
                      onClick={() => handleEdit(barber)}
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-2" />
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex flex-col p-4 space-y-4">
          {filteredBarbers.map((barber) => (
            <Card key={barber.id} className="p-4 border border-border/50 bg-card shadow-sm hover:bg-muted/10 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-foreground leading-none mb-1 text-sm">{barber.name}</h3>
                    <span className={`text-[9px] tracking-widest uppercase font-bold ${barber.active ? 'text-emerald-500' : 'text-destructive'}`}>
                      {barber.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                <div className="flex bg-muted/50 rounded-lg">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-xl" onClick={() => handleEdit(barber)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/50">
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Comissão Servi.</span>
                  <span className="font-black text-orange-500">{barber.commissionService || barber.commission || 0}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Comissão Prod.</span>
                  <span className="font-black text-orange-500">{barber.commissionProduct || 0}%</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
          {filteredBarbers.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-sm opacity-50">Nenhum barbeiro encontrado</p>
            </div>
          )}
        <Button 
          className="md:hidden fixed bottom-[88px] right-4 h-14 w-14 rounded-full shadow-xl z-50 flex items-center justify-center p-0"
          onClick={() => {
            setEditingBarber(null);
            setFormData({ name: '', phone: '', serviceCommission: '', productCommission: '', active: true });
            setIsOpen(true);
          }}
          disabled={!isActive}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </Card>
    </div>
  );
}
