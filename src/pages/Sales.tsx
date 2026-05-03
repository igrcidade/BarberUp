import React, { useEffect, useState } from 'react';
import { 
  Plus, Search, ShoppingCart, Trash2, CheckCircle2, User, Scissors, Package, Pencil, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { subscribeToCollection, addDocument, deleteDocument, updateDocument } from '../lib/db';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

const highlightMatch = (text: string, query: string) => {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="text-primary font-black bg-primary/10 px-1 rounded">{part}</span>
        ) : (
          <span key={i} className="text-foreground">{part}</span>
        )
      )}
    </>
  );
};

export default function Sales() {
  const { isActive } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  
  const [currentSale, setCurrentSale] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('none');
  const [selectedBarberId, setSelectedBarberId] = useState<string>('none');
  const [paymentMethod, setPaymentMethod] = useState<string>('Dinheiro');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [serviceSearch, setServiceSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [barberSearch, setBarberSearch] = useState('');
  const [isClientOpen, setIsClientOpen] = useState(false);
  const [isBarberOpen, setIsBarberOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');

  const [editingSale, setEditingSale] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [editFormData, setEditFormData] = useState<any>({ 
    paymentMethod: 'Dinheiro',
    items: [],
    clientName: '',
    total: 0
  });

  useEffect(() => {
    const unsubSales = subscribeToCollection('sales', setSales);
    const unsubServices = subscribeToCollection('services', setServices);
    const unsubProducts = subscribeToCollection('products', setProducts);
    const unsubClients = subscribeToCollection('clients', setClients);
    const unsubBarbers = subscribeToCollection('barbers', setBarbers);

    return () => {
      unsubSales();
      unsubServices();
      unsubProducts();
      unsubClients();
      unsubBarbers();
    };
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    
    // Create the client in Firebase
    const docRef = await addDocument('clients', {
      name: newClientName,
      phone: newClientPhone,
      notes: 'Cadastrado no terminal de vendas'
    });
    
    // Automatically select the new client
    // Depending on addDocument implementation, if docRef.id exists:
    if (docRef && docRef.id) {
       setSelectedClientId(docRef.id);
    }
    setClientSearch(newClientName);
    
    // Close and reset
    setIsAddClientOpen(false);
    setNewClientName('');
    setNewClientPhone('');
  };

  const addToSale = (item: any, type: 'service' | 'product') => {
    setCurrentSale([...currentSale, { ...item, type, saleId: Math.random().toString(36).substr(2, 9) }]);
  };

  const removeFromSale = (saleId: string) => {
    setCurrentSale(currentSale.filter(item => item.saleId !== saleId));
  };

  const total = currentSale.reduce((acc, curr) => acc + curr.price, 0);

  const finalizeSale = async () => {
    if (currentSale.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const selectedClient = clients.find(c => c.id === selectedClientId);
      const selectedBarber = barbers.find(b => b.id === selectedBarberId);
      
      // Calcula a comissão por item dependendo do seu tipo
      let commissionTotal = 0;
      
      const productQuantities: Record<string, number> = {};
      
      const items = currentSale.map(item => {
        let commissionValue = 0;
        if (selectedBarber) {
          if (item.type === 'service') {
            const comRate = selectedBarber.commissionService !== undefined ? selectedBarber.commissionService : (selectedBarber.commission || 0);
            commissionValue = item.price * (comRate / 100);
          } else if (item.type === 'product') {
            const comRate = selectedBarber.commissionProduct || 0;
            commissionValue = item.price * (comRate / 100);
          }
          commissionTotal += commissionValue;
        }
        
        if (item.type === 'product') {
          if (!productQuantities[item.id]) {
            productQuantities[item.id] = 0;
          }
          productQuantities[item.id] += 1;
        }
        
        return {
          id: item.id,
          name: item.name,
          price: item.price,
          type: item.type,
          commissionValue
        };
      });

      for (const [productId, quantity] of Object.entries(productQuantities)) {
        const product = products.find(p => p.id === productId);
        if (product) {
          const newStock = Math.max(0, (product.stock || 0) - quantity);
          await updateDocument('products', productId, { stock: newStock });
        }
      }

      const saleData = {
        clientId: selectedClientId === 'none' ? null : selectedClientId,
        clientName: selectedClient ? selectedClient.name : (clientSearch || 'Venda Avulsa'),
        barberId: selectedBarberId === 'none' ? null : selectedBarberId,
        barberName: selectedBarber ? selectedBarber.name : null,
        items,
        total,
        paymentMethod,
        commissionTotal
      };

      await addDocument('sales', saleData);
      setCurrentSale([]);
      setSelectedClientId('none');
      setSelectedBarberId('none');
      setClientSearch('');
      setBarberSearch('');
      setServiceSearch('');
      setProductSearch('');
      setPaymentMethod('Dinheiro');
      setIsSuccessOpen(true);
    } catch (error: any) {
      console.error(error);
      toast.error('Ocorreu um erro ao finalizar a venda.', { description: error?.message || 'Tente novamente mais tarde.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSale = (sale: any) => {
    setEditingSale(sale);
    setEditFormData({ 
      paymentMethod: sale.paymentMethod,
      items: [...(sale.items || [])],
      clientName: sale.clientName,
      total: sale.total
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSale = async () => {
    if (!editingSale) return;
    await updateDocument('sales', editingSale.id, editFormData);
    setIsEditDialogOpen(false);
    setEditingSale(null);
  };

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDocument('sales', deleteConfirm);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const sortedSales = [...sales].sort((a, b) => {
    const aDate = a.createdAt;
    const bDate = b.createdAt;
    if (!aDate || !bDate) return 0;
    
    const dateA = aDate.toDate ? aDate.toDate() : parseISO(aDate);
    const dateB = bDate.toDate ? bDate.toDate() : parseISO(bDate);
    return dateB.getTime() - dateA.getTime();
  });

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()) || 
    s.category.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const filteredClientsForSelect = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
    c.phone?.includes(clientSearch)
  );

  const filteredBarbersForSelect = barbers.filter(b => 
    b.active && b.name.toLowerCase().includes(barberSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col xl:flex-row gap-8 animate-in fade-in duration-700 min-h-[calc(100vh-140px)]">
      {/* Main Area: Catalog Selection */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">
              Terminal de <span className="text-primary italic">Vendas</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium">Selecione itens para compor o atendimento</p>
          </div>
        </div>

        {/* IDENTIFICAR CLIENTE E BARBEIRO */}
        <div className="p-5 bg-card border border-border rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">1. Identificar</Label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 text-[10px] uppercase font-bold tracking-widest px-2"
                onClick={() => setIsAddClientOpen(true)}
              >
                <Plus className="w-3 h-3 mr-1" /> Cliente
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative pt-6">
              <Label className="absolute top-0 left-1 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Membro / Cliente</Label>
              <Search className={`absolute left-4 top-[calc(50%+12px)] -translate-y-1/2 h-5 w-5 transition-colors group-focus-within:text-primary ${selectedClientId !== 'none' ? 'text-primary' : 'text-muted-foreground'}`} />
              <Input 
                placeholder="Busque o cliente..." 
                className={`pl-12 pr-10 h-14 bg-muted/50 rounded-xl text-base focus:ring-2 focus:ring-primary/20 font-medium transition-all cursor-pointer ${selectedClientId !== 'none' ? 'border-primary ring-1 ring-primary bg-primary/5 text-primary text-xl font-black' : 'border-border'}`}
                value={clientSearch}
                onFocus={() => setIsClientOpen(true)}
                onBlur={() => setTimeout(() => setIsClientOpen(false), 200)}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  if (selectedClientId !== 'none') setSelectedClientId('none');
                }}
              />
              <ChevronDown className="absolute right-4 top-[calc(50%+12px)] -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              {isClientOpen && (
                <div className="absolute z-[60] w-full mt-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[250px] overflow-y-auto">
                  <div 
                    className="p-4 text-xs cursor-pointer hover:bg-primary/10 border-b border-border font-bold text-primary transition-colors flex items-center gap-2 uppercase tracking-wider"
                    onClick={() => {
                      setSelectedClientId('none');
                      setClientSearch('Consumidor Avulso');
                    }}
                  >
                    <User className="w-4 h-4" /> Consumidor Estreante
                  </div>
                  {filteredClientsForSelect.map(c => (
                    <div 
                      key={c.id} 
                      className="p-4 text-sm cursor-pointer hover:bg-muted transition-all flex flex-col border-b border-border last:border-0 px-6"
                      onClick={() => {
                        setSelectedClientId(c.id);
                        setClientSearch(c.name);
                      }}
                    >
                      <span className="font-bold text-xs uppercase tracking-tight">{highlightMatch(c.name, clientSearch)}</span>
                      {c.phone && <span className="text-[9px] text-muted-foreground font-medium mt-0.5">{highlightMatch(c.phone, clientSearch)}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="relative pt-6">
              <Label className="absolute top-0 left-1 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Barbeiro / Atendimento</Label>
              <Search className={`absolute left-4 top-[calc(50%+12px)] -translate-y-1/2 h-5 w-5 transition-colors group-focus-within:text-primary ${selectedBarberId !== 'none' ? 'text-primary' : 'text-muted-foreground'}`} />
              <Input 
                placeholder="Busque o barbeiro..." 
                className={`pl-12 pr-10 h-14 bg-muted/50 rounded-xl text-base focus:ring-2 focus:ring-primary/20 font-medium transition-all cursor-pointer ${selectedBarberId !== 'none' ? 'border-primary ring-1 ring-primary bg-primary/5 text-primary text-xl font-black' : 'border-border'}`}
                value={barberSearch}
                onFocus={() => setIsBarberOpen(true)}
                onBlur={() => setTimeout(() => setIsBarberOpen(false), 200)}
                onChange={(e) => {
                  setBarberSearch(e.target.value);
                  if (selectedBarberId !== 'none') setSelectedBarberId('none');
                }}
              />
              <ChevronDown className="absolute right-4 top-[calc(50%+12px)] -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              {isBarberOpen && (
                <div className="absolute z-[60] w-full mt-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[250px] overflow-y-auto">
                   <div 
                    className="p-4 text-xs cursor-pointer hover:bg-primary/10 border-b border-border font-bold text-primary transition-colors flex items-center gap-2 uppercase tracking-wider"
                    onClick={() => {
                      setSelectedBarberId('none');
                      setBarberSearch('Sem Barbeiro');
                    }}
                  >
                    <Scissors className="w-4 h-4" /> Sem Barbeiro
                  </div>
                  {filteredBarbersForSelect.map(b => (
                    <div 
                      key={b.id} 
                      className="p-4 text-sm cursor-pointer hover:bg-muted transition-all flex flex-col border-b border-border last:border-0 px-6"
                      onClick={() => {
                        setSelectedBarberId(b.id);
                        setBarberSearch(b.name);
                      }}
                    >
                      <span className="font-bold text-xs uppercase tracking-tight">{highlightMatch(b.name, barberSearch)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between items-end pb-2 border-b border-border/50">
          <div className="space-y-3 flex-1 w-full relative group">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">2. Adicionar Itens</Label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input 
                placeholder="Pesquisar serviços ou produtos..." 
                className="pl-12 h-14 bg-card border-border rounded-xl text-base shadow-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium" 
                value={serviceSearch || productSearch}
                onChange={(e) => {
                  setServiceSearch(e.target.value);
                  setProductSearch(e.target.value);
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border h-14">
            <Button 
              variant={activeTab === 'services' ? "secondary" : "ghost"} 
              size="sm" 
              className="rounded-lg px-6 h-full text-xs font-bold uppercase tracking-wider"
              onClick={() => { setActiveTab('services'); setServiceSearch(''); setProductSearch(''); }}
            >
              Serviços
            </Button>
            <Button 
              variant={activeTab === 'products' ? "secondary" : "ghost"} 
              size="sm" 
              className="rounded-lg px-6 h-full text-xs font-bold uppercase tracking-wider"
              onClick={() => { setActiveTab('products'); setServiceSearch(''); setProductSearch(''); }}
            >
              Produtos
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 -mx-2 py-2 -my-2 space-y-8 scrollbar-thin">
          {/* Catalogo de Serviços */}
          {activeTab === 'services' && filteredServices.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Scissors className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Serviços Profissionais</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredServices.map(s => (
                  <motion.button
                    key={s.id}
                    whileHover={{ y: -2 }}
                    className="relative flex flex-col items-start p-4 bg-card border border-border rounded-xl text-left transition-all hover:border-primary/50 hover:bg-primary/5 group shadow-sm min-h-[90px] active:border-primary/50"
                    onClick={() => addToSale(s, 'service')}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 line-clamp-1">{s.category}</span>
                    <span className="text-xs font-bold text-foreground leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors">{s.name}</span>
                    <div className="mt-auto flex items-center justify-between w-full">
                      <span className="text-sm font-black text-foreground">R$ {s.price.toFixed(2)}</span>
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Catalogo de Produtos */}
          {activeTab === 'products' && filteredProducts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Package className="w-4 h-4 text-secondary-foreground" />
                </div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Produtos & Home Care</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProducts.map(p => (
                  <motion.button
                    key={p.id}
                    whileHover={{ y: -2 }}
                    disabled={p.stock <= 0}
                    className="relative flex flex-col items-start p-4 bg-card border border-border rounded-xl text-left transition-all hover:border-secondary/50 hover:bg-secondary/5 group shadow-sm min-h-[100px] disabled:opacity-40 active:border-secondary/50"
                    onClick={() => addToSale(p, 'product')}
                  >
                    <div className="flex w-full items-start justify-between mb-2 gap-2">
                      <div className="flex flex-col gap-1 pr-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none">{p.category}</span>
                        {p.brand && <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground leading-none line-clamp-1">{p.brand}</span>}
                      </div>
                      <span className={`text-[9px] font-bold uppercase shrink-0 mt-0.5 ${p.stock <= (p.minStock || 5) ? 'text-destructive' : 'text-emerald-500'}`}>{p.stock} un</span>
                    </div>
                    <span className="text-xs font-bold text-foreground leading-tight line-clamp-2 mb-2 group-hover:text-secondary-foreground transition-colors">{p.name}</span>
                    <div className="mt-auto flex items-center justify-between w-full">
                      <span className="text-sm font-black text-foreground">R$ {p.price.toFixed(2)}</span>
                      <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center text-secondary-foreground group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Sidebar */}
      <div className="w-full xl:w-[400px] flex flex-col gap-6">
        <Card className="flex flex-col h-fit barber-card border-none shadow-2xl relative overflow-hidden bg-card/50 backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
          
          <CardHeader className="py-6 px-8 border-b border-border bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-xl font-bold uppercase tracking-tight">Checkout</CardTitle>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">Sessão # {Math.random().toString(36).substr(2, 4).toUpperCase()}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex flex-col">
            <div className={`p-8 space-y-4 ${currentSale.length > 5 ? 'overflow-y-auto max-h-[500px] scrollbar-thin' : ''} ${currentSale.length === 0 ? 'flex items-center justify-center py-20' : ''}`}>
              <AnimatePresence mode="popLayout">
                {Object.values(currentSale.reduce((acc, curr) => {
                  if (!acc[curr.id]) {
                    acc[curr.id] = { ...curr, quantity: 1, saleIds: [curr.saleId] };
                  } else {
                    acc[curr.id].quantity += 1;
                    acc[curr.id].saleIds.push(curr.saleId);
                  }
                  return acc;
                }, {} as Record<string, any>)).map((item: any) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    key={item.id} 
                    className="flex justify-between items-center bg-card p-4 rounded-xl border border-border group shadow-sm hover:border-primary/20 transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground leading-none">
                        {item.name} {item.quantity > 1 ? <span className="text-primary font-black ml-1">{item.quantity}x</span> : null}
                      </span>
                      <span className="text-[8px] font-bold text-muted-foreground uppercase mt-1 tracking-wider">
                        {item.type === 'service' ? 'Procedimento' : 'Venda'}
                        {item.brand && ` • ${item.brand}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-sm text-foreground">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 flex items-center justify-center text-destructive hover:text-white hover:bg-destructive rounded-lg bg-destructive/10 transition-all flex-shrink-0"
                        onClick={() => removeFromSale(item.saleIds[item.saleIds.length - 1])}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {currentSale.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center opacity-50">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6 text-muted-foreground ring-8 ring-muted/50">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-1">Carrinho Vazio</h4>
                  <p className="text-[10px] text-muted-foreground font-medium max-w-[200px]">Adicione serviços ou produtos ao lado para iniciar o recebimento</p>
                </div>
              )}
            </div>

            <div className="p-8 space-y-6 border-t border-border bg-muted/20 max-md:pb-[160px]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">3. Método de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="w-full h-12 bg-card border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 font-bold uppercase text-[10px] tracking-wider">
                      <SelectValue placeholder="Forma de Pagamento" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground rounded-xl">
                      <SelectItem value="Crédito" className="text-[10px] font-bold uppercase py-3">Crédito</SelectItem>
                      <SelectItem value="Débito" className="text-[10px] font-bold uppercase py-3">Débito</SelectItem>
                      <SelectItem value="Dinheiro" className="text-[10px] font-bold uppercase py-3">Dinheiro</SelectItem>
                      <SelectItem value="Pix" className="text-[10px] font-bold uppercase py-3 text-emerald-500 font-black">Pix</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:z-40 max-md:bg-background/90 max-md:backdrop-blur-xl max-md:p-4 max-md:pb-[calc(1rem+env(safe-area-inset-bottom))] max-md:border-t-solid max-md:shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subtotal</span>
                  <span className="text-sm font-bold text-foreground">R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider italic">Total do Caixa</span>
                  <span className="text-3xl max-md:text-2xl font-bold text-primary tracking-tighter">
                    <span className="text-xs mr-1 font-medium text-primary opacity-50 not-italic">R$</span>
                    {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <Button
                  type="button"
                  className="barber-button-primary w-full h-16 max-md:h-14 text-sm flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 touch-manipulation" 
                  disabled={currentSale.length === 0 || !isActive || isSubmitting}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    finalizeSale();
                  }}
                >
                  <CheckCircle2 className="w-5 h-5 max-md:w-4 max-md:h-4" /> 
                  {isSubmitting ? 'FINALIZANDO...' : 'FINALIZAR VENDA'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <EditSaleDialog 
        isOpen={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
        formData={editFormData}
        setFormData={setEditFormData}
        onSave={handleUpdateSale}
        services={services}
        products={products}
      />

      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="max-w-sm bg-card border-border rounded-3xl p-8 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-4 text-center text-foreground">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </motion.div>
              <span className="text-xl font-bold uppercase tracking-tight">Venda Finalizada!</span>
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4 text-muted-foreground text-sm font-medium">
            O atendimento foi registrado e o estoque atualizado com sucesso.
          </div>
          <DialogFooter className="sm:justify-center">
            <Button className="w-full h-12 barber-button-primary shadow-sm" onClick={() => setIsSuccessOpen(false)}>
              Continuar Atendendo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-md bg-card border-border rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold uppercase tracking-tight text-foreground">Excluir Venda?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita. O estoque não será reposto automaticamente se houverem produtos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} className="h-12 rounded-xl text-xs font-bold uppercase tracking-widest">Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} className="h-12 rounded-xl text-xs font-bold uppercase tracking-widest px-8">Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cadastrar Novo Cliente Modal */}
      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
        <DialogContent className="bg-card border-border rounded-3xl p-0 overflow-hidden shadow-2xl max-w-md">
          <DialogHeader className="p-8 pb-4 bg-muted/30 border-b border-border">
            <DialogTitle className="text-xl font-bold text-foreground uppercase tracking-tight">
              Cadastrar Novo Cliente
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs font-medium">Cadastre rapidamente e continue a venda</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateClient} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Nome Completo *</Label>
                <Input 
                  value={newClientName} 
                  onChange={(e) => setNewClientName(e.target.value)} 
                  required 
                  className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-foreground font-bold"
                  placeholder="Ex: Luan Souza"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Telefone / WhatsApp</Label>
                <Input 
                  placeholder="(00) 00000-0000"
                  value={newClientPhone} 
                  onChange={(e) => setNewClientPhone(e.target.value)} 
                  className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-foreground font-bold"
                />
              </div>
            </div>
            <DialogFooter className="pt-4 flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsAddClientOpen(false)} className="rounded-xl h-12 text-muted-foreground font-bold text-xs uppercase tracking-wider">Cancelar</Button>
              <Button type="submit" className="barber-button-primary px-6 shadow-sm">
                CADASTRAR
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditSaleDialog({ isOpen, onOpenChange, formData, setFormData, onSave, services, products }: any) {
  const removeItem = (idx: number) => {
    const newItems = [...formData.items];
    newItems.splice(idx, 1);
    const newTotal = newItems.reduce((acc: number, curr: any) => acc + curr.price, 0);
    setFormData({ ...formData, items: newItems, total: newTotal });
  };

  const addItem = (item: any, type: string) => {
    const newItems = [...formData.items, { ...item, type }];
    const newTotal = newItems.reduce((acc: number, curr: any) => acc + curr.price, 0);
    setFormData({ ...formData, items: newItems, total: newTotal });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-card border-border rounded-3xl p-0 shadow-3xl">
        <DialogHeader className="p-8 pb-4 border-b border-border bg-muted/30">
          <DialogTitle className="text-xl font-bold text-foreground uppercase tracking-tight">Editar Atendimento</DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs font-medium">Modifique itens ou a forma de pagamento da venda selecionada</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
            <div className="space-y-2.5">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Forma de Pagamento</Label>
              <Select value={formData.paymentMethod} onValueChange={(val) => setFormData({ ...formData, paymentMethod: val })}>
                <SelectTrigger className="bg-muted/50 border-border rounded-xl h-12 focus:ring-1 focus:ring-primary/20 font-bold uppercase text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground rounded-xl">
                  <SelectItem value="Crédito" className="text-[10px] font-bold uppercase">Crédito</SelectItem>
                  <SelectItem value="Débito" className="text-[10px] font-bold uppercase">Débito</SelectItem>
                  <SelectItem value="Dinheiro" className="text-[10px] font-bold uppercase">Dinheiro</SelectItem>
                  <SelectItem value="Pix" className="text-[10px] font-bold uppercase">Pix</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2.5">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Cliente</Label>
              <div className="h-12 bg-muted/20 border border-border rounded-xl flex items-center px-4 text-foreground font-bold text-sm uppercase tracking-tight">
                {formData.clientName}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] uppercase font-bold text-primary tracking-widest ml-1">Itens Adicionados</Label>
            <div className="space-y-2">
              {formData.items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border border-dashed group transition-colors hover:border-primary/20">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-[8px] font-bold uppercase ${item.type === 'service' ? 'text-primary border-primary/20 bg-primary/5' : 'text-blue-500 border-blue-500/20 bg-blue-500/5'}`}>
                      {item.type === 'service' ? 'Serviço' : 'Produto'}
                    </Badge>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground text-sm tracking-tight">{item.name}</span>
                      {item.brand && <span className="text-[9px] font-bold uppercase text-muted-foreground">{item.brand}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-bold text-foreground text-sm">R$ {item.price.toFixed(2)}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-all rounded-lg" onClick={() => removeItem(idx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {formData.items.length === 0 && (
                <div className="p-10 text-center border-2 border-dashed border-border rounded-xl text-muted-foreground italic text-xs">
                  O atendimento não possui itens.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 pt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 ml-1">
                <Scissors className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Incluir Serviço</span>
              </div>
              <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-2 scrollbar-thin scrollbar-thumb-primary/10">
                {services.map((s: any) => (
                  <Button 
                    key={s.id} 
                    variant="ghost" 
                    className="w-full justify-between text-[10px] h-10 hover:bg-primary/10 hover:text-primary rounded-xl px-4 font-bold border border-transparent hover:border-primary/20 uppercase tracking-wider" 
                    onClick={() => addItem(s, 'service')}
                  >
                    <span>{s.name}</span>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 ml-1">
                <Package className="w-3 h-3 text-secondary-foreground" />
                <span className="text-[10px] font-bold text-secondary-foreground uppercase tracking-widest">Incluir Produto</span>
              </div>
              <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-2 scrollbar-thin scrollbar-thumb-muted">
                {products.map((p: any) => (
                  <Button 
                    key={p.id} 
                    variant="ghost" 
                    className="w-full justify-between text-[10px] h-auto py-3 hover:bg-secondary/10 hover:text-secondary-foreground rounded-xl px-4 font-bold border border-transparent hover:border-secondary/20 uppercase tracking-wider items-start text-left" 
                    onClick={() => addItem(p, 'product')}
                  >
                    <div className="flex flex-col">
                      <span>{p.name}</span>
                      {p.brand && <span className="text-[8px] text-muted-foreground">{p.brand}</span>}
                    </div>
                    <Plus className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 pt-6 bg-muted/30 border-t border-border flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-1 opacity-60">Valor Atualizado</span>
            <span className="text-2xl font-bold text-primary tracking-tight">R$ {formData.total.toFixed(2)}</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12 px-6 font-bold text-muted-foreground hover:text-foreground transition-colors text-xs uppercase tracking-wider">Voltar</Button>
            <Button onClick={onSave} className="barber-button-primary h-12 px-8 shadow-md">Salvar Alterações</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
