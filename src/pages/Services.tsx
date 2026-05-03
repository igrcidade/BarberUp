import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Scissors, Search, Sparkles } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '../lib/db';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';

export default function Services() {
  const { isActive } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', price: '', category: 'Cabelo', duration: '30' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    return subscribeToCollection('services', setServices);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData, price: parseFloat(formData.price) };
    if (editingService) {
      await updateDocument('services', editingService.id, data);
    } else {
      await addDocument('services', data);
    }
    setIsOpen(false);
    setEditingService(null);
    setFormData({ name: '', price: '', category: 'Cabelo', duration: '30' });
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({ 
      name: service.name, 
      price: service.price.toString(), 
      category: service.category,
      duration: service.duration || '30'
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este serviço?')) {
      await deleteDocument('services', id);
    }
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">
            Menu de <span className="text-primary">Serviços</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Configure sua lista de procedimentos e preços</p>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingService(null);
            setFormData({ name: '', price: '', category: 'Cabelo', duration: '30' });
          }
        }}>
          <DialogTrigger render={<Button disabled={!isActive} className="hidden md:flex barber-button-primary h-12 px-8 shadow-md" />}>
            <Plus className="w-5 h-5 mr-1" /> NOVO SERVIÇO
          </DialogTrigger>
          <DialogContent className="bg-card border-border rounded-3xl p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-8 pb-4 bg-muted/30 border-b border-border">
              <DialogTitle className="text-xl font-bold text-foreground uppercase tracking-tight">
                {editingService ? 'Editar Procedimento' : 'Adicionar ao Menu'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs font-medium">Defina o nome, valor e duração média do serviço</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Nome do Serviço</Label>
                  <Input 
                    placeholder="Ex: Corte Degradê + Barba"
                    className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-foreground font-bold"
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Preço (R$)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="50,00"
                      className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-primary font-bold text-lg"
                      value={formData.price} 
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Duração (Min)</Label>
                    <Input 
                      type="number" 
                      placeholder="30"
                      className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-foreground font-bold"
                      value={formData.duration} 
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })} 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Categoria</Label>
                  <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                    <SelectTrigger className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-foreground font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      <SelectItem value="Cabelo">Cabelo</SelectItem>
                      <SelectItem value="Barba">Barba</SelectItem>
                      <SelectItem value="Combo">Combo Premium</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="barber-button-primary w-full h-12 shadow-sm uppercase tracking-wider text-xs">
                  {editingService ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR SERVIÇO'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input 
          placeholder="Buscar serviços por nome ou categoria..." 
          className="h-14 pl-12 bg-card border-border rounded-2xl text-base font-medium shadow-sm focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-border bg-card shadow-sm rounded-3xl overflow-hidden">
        <div className="overflow-x-auto hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border bg-muted/40">
                <TableHead className="pl-8 py-5 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Procedimento</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Tipo</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Execução</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest text-right">Preço Sugerido</TableHead>
                <TableHead className="text-right pr-8 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredServices.map((service, i) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    key={service.id} 
                    className="group border-border hover:bg-muted/10 transition-all"
                  >
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                          <Scissors className="w-4 h-4 text-primary" />
                        </div>
                        <div className="font-bold text-foreground text-sm tracking-tight uppercase">{service.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[8px] font-bold bg-muted/50 border-border text-muted-foreground px-2 py-0.5 rounded-full uppercase">
                        {service.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground font-bold text-[10px] uppercase">
                        <Sparkles className="w-3 h-3 text-primary/60" /> {service.duration || '--'} min
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-5 px-4 font-bold text-lg tracking-tight text-foreground">
                      <span className="text-[10px] mr-1 opacity-40 font-medium">R$</span>
                      {service.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-lg"
                          onClick={() => handleEdit(service)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() => handleDelete(service.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex flex-col p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service, i) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                key={service.id}
              >
                <Card className="p-4 border border-border/50 bg-card shadow-sm hover:bg-muted/10 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Scissors className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-bold text-foreground leading-none mb-1 text-sm uppercase">{service.name}</h3>
                        <span className={`text-[9px] tracking-widest uppercase font-bold text-muted-foreground`}>
                          {service.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex bg-muted/50 rounded-lg">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted/10 rounded-xl" onClick={() => handleEdit(service)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => handleDelete(service.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/50">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Duração</span>
                      <span className="font-bold text-xs">{service.duration || '--'} min</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Preço</span>
                      <span className="font-bold text-sm tracking-tight">R$ {service.price.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <Button 
          className="md:hidden fixed bottom-[88px] right-4 h-14 w-14 rounded-full shadow-xl z-50 flex items-center justify-center p-0"
          onClick={() => {
            setEditingService(null);
            setFormData({ name: '', price: '0', category: '', duration: '', stock: '', minStock: '', brand: '' });
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
