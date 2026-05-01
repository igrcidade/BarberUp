import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Package, Search, AlertCircle } from 'lucide-react';
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

export default function Products() {
  const { isActive } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', category: 'Cabelo', minStock: '5' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    return subscribeToCollection('products', setProducts);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { 
      ...formData, 
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      minStock: parseInt(formData.minStock)
    };
    if (editingProduct) {
      await updateDocument('products', editingProduct.id, data);
    } else {
      await addDocument('products', data);
    }
    setIsOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', price: '', stock: '', category: 'Cabelo', minStock: '5' });
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({ 
      name: product.name, 
      price: product.price.toString(), 
      stock: product.stock.toString(),
      category: product.category,
      minStock: (product.minStock || 5).toString()
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este produto?')) {
      await deleteDocument('products', id);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">
            Controle de <span className="text-primary">Estoque</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Gerencie seus produtos, vendas e reposição</p>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingProduct(null);
            setFormData({ name: '', price: '', stock: '', category: 'Cabelo', minStock: '5' });
          }
        }}>
          <DialogTrigger render={<Button disabled={!isActive} className="barber-button-primary h-12 px-8 shadow-md" />}>
            <Plus className="w-5 h-5 mr-1" /> NOVO PRODUTO
          </DialogTrigger>
          <DialogContent className="bg-card border-border rounded-3xl p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-8 pb-4 bg-muted/30 border-b border-border">
              <DialogTitle className="text-xl font-bold text-foreground uppercase tracking-tight">
                {editingProduct ? 'Editar Produto' : 'Cadastrar Item'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs font-medium">Defina o inventário inicial e preços de revenda</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Nome do Produto</Label>
                  <Input 
                    placeholder="Ex: Pomada Efeito Matte 150g"
                    className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-foreground font-bold"
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Preço Venda (R$)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="45,00"
                      className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-primary font-bold text-lg"
                      value={formData.price} 
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Qtd. Estoque</Label>
                    <Input 
                      type="number" 
                      placeholder="10"
                      className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-foreground font-bold"
                      value={formData.stock} 
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })} 
                      required 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Categoria</Label>
                    <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                      <SelectTrigger className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-foreground font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground">
                        <SelectItem value="Cabelo">Cabelo</SelectItem>
                        <SelectItem value="Barba">Barba</SelectItem>
                        <SelectItem value="Rosto">Rosto</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Alerta Mínimo</Label>
                    <Input 
                      type="number" 
                      placeholder="5"
                      className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-foreground font-bold"
                      value={formData.minStock} 
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })} 
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="barber-button-primary w-full h-12 shadow-sm uppercase tracking-wider text-xs">
                  {editingProduct ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR CADASTRO'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input 
          placeholder="Buscar produtos por nome ou marca..." 
          className="h-14 pl-12 bg-card border-border rounded-2xl text-base font-medium shadow-sm focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-border bg-card shadow-sm rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border bg-muted/40">
                <TableHead className="pl-8 py-5 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Produto / SKU</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Grupamento</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Disponibilidade</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest text-right">Valor Unitário</TableHead>
                <TableHead className="text-right pr-8 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Gerenciar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, i) => {
                  const isLowStock = product.stock <= (product.minStock || 5);
                  return (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      key={product.id} 
                      className="group border-border hover:bg-muted/10 transition-all font-sans"
                    >
                      <TableCell className="pl-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                            <Package className="w-4 h-4 text-primary" />
                          </div>
                          <div className="font-bold text-foreground text-sm tracking-tight uppercase">{product.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[8px] font-bold bg-muted/50 border-border text-muted-foreground px-2 py-0.5 rounded-full uppercase">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`px-3 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-2 uppercase tracking-tight transition-colors ${isLowStock ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-muted/50 text-foreground border-border'}`}>
                            {product.stock} em estoque
                            {isLowStock && <AlertCircle className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-5 px-4 font-bold text-lg tracking-tight text-foreground">
                        <span className="text-[10px] mr-1 opacity-40 font-medium">R$</span>
                        {product.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-lg"
                            onClick={() => handleEdit(product)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                            onClick={() => handleDelete(product.id)}
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
      </Card>
    </div>
  );
}
