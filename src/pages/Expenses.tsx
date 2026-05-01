import React, { useEffect, useState } from 'react';
import { 
  Plus, Trash2, Receipt, Calendar as CalendarIcon, Filter, 
  Repeat, Pencil, ChevronLeft, ChevronRight, AlertCircle, 
  TrendingDown, PieChart, Landmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { subscribeToCollection, addDocument, deleteDocument, updateDocument } from '../lib/db';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';

const categories = ['Aluguel', 'Energia', 'Água', 'Internet', 'Produtos', 'Manutenção', 'Marketing', 'Outros', 'Salários'];

export default function Expenses() {
  const { isActive } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [viewDate, setViewDate] = useState(new Date());

  const [formData, setFormData] = useState({ 
    description: '', 
    amount: '', 
    category: 'Outros', 
    date: format(new Date(), 'yyyy-MM-dd'),
    isRecurrent: false 
  });

  useEffect(() => {
    return subscribeToCollection('expenses', setExpenses);
  }, []);

  const resetForm = () => {
    setFormData({ 
      description: '', 
      amount: '', 
      category: 'Outros', 
      date: format(new Date(), 'yyyy-MM-dd'),
      isRecurrent: false 
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { 
      ...formData, 
      amount: parseFloat(formData.amount || '0'),
      date: formData.date
    };

    if (editingId) {
      await updateDocument('expenses', editingId, data);
    } else {
      await addDocument('expenses', data);
    }
    
    setIsOpen(false);
    resetForm();
  };

  const handleEdit = (expense: any) => {
    setEditingId(expense.id);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      isRecurrent: expense.isRecurrent || false
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir esta despesa?')) {
      await deleteDocument('expenses', id);
    }
  };

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);

  const filteredExpenses = expenses.filter(e => {
    if (!e.date) return false;
    const expenseDate = parseISO(e.date);
    
    // If it's recurrent, it shows up in every month starting from its creation month
    if (e.isRecurrent) {
      const startOfMonthOfExpense = startOfMonth(expenseDate);
      return startOfMonthOfExpense <= monthStart;
    }
    
    return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
  });

  const totalMonthlyExpenses = filteredExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  const nextMonth = () => setViewDate(addMonths(viewDate, 1));
  const prevMonth = () => setViewDate(subMonths(viewDate, 1));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">
            Controle <span className="text-primary">Financeiro</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Gerencie saídas fixas e variáveis da sua operação</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-3 bg-muted/50 p-1.5 rounded-xl border border-border shadow-sm">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-lg h-9 w-9 hover:bg-background transition-all"><ChevronLeft className="w-4 h-4" /></Button>
            <div className="flex flex-col items-center min-w-[100px]">
              <span className="text-xs font-bold text-foreground uppercase tracking-tight">{format(viewDate, 'MMMM', { locale: ptBR })}</span>
              <span className="text-[10px] text-muted-foreground font-medium opacity-60 leading-none">{format(viewDate, 'yyyy')}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-lg h-9 w-9 hover:bg-background transition-all"><ChevronRight className="w-4 h-4" /></Button>
          </div>
          
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger render={<Button disabled={!isActive} className="barber-button-primary h-12 px-8 shadow-md" />}>
              <Plus className="w-5 h-5 mr-1" /> NOVO LANÇAMENTO
            </DialogTrigger>
            <DialogContent className="bg-card border-border rounded-3xl p-0 overflow-hidden shadow-2xl max-w-lg">
              <DialogHeader className="p-8 pb-4 bg-muted/30 border-b border-border">
                <DialogTitle className="text-xl font-bold text-foreground uppercase tracking-tight">
                  {editingId ? 'Editar Despesa' : 'Novo Gasto'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs font-medium">Registre saídas de caixa para manter o lucro real atualizado</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Descrição do Pagamento</Label>
                    <Input 
                      placeholder="Ex: Aluguel da Unidade"
                      className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-foreground font-bold"
                      value={formData.description} 
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Montante (R$)</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-primary font-bold text-lg"
                        value={formData.amount} 
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Data Base</Label>
                      <Input 
                        type="date" 
                        className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-foreground font-bold"
                        value={formData.date} 
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Categoria</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(val) => setFormData({ ...formData, category: val })}
                    >
                      <SelectTrigger className="h-12 bg-muted/30 border-border rounded-xl focus:ring-1 focus:ring-primary/20 text-foreground font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground">
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat} className="font-bold text-xs uppercase text-foreground">{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-2">
                    <div 
                      className={`flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${formData.isRecurrent ? 'bg-primary/5 border-primary/20' : 'bg-muted/20 border-border hover:bg-muted/40'}`}
                      onClick={() => setFormData({ ...formData, isRecurrent: !formData.isRecurrent })}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all border ${formData.isRecurrent ? 'bg-primary border-primary/20 text-primary-foreground' : 'bg-muted border-border text-muted-foreground'}`}>
                        <Repeat className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs font-bold text-foreground uppercase tracking-tight cursor-pointer">Ativar Recorrência</Label>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase opacity-60">Lançar automaticamente todos os meses</p>
                      </div>
                      <Checkbox 
                        checked={formData.isRecurrent} 
                        className="h-5 w-5 border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground rounded-md"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="barber-button-primary w-full h-12 shadow-sm text-xs uppercase tracking-wider">
                    {editingId ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR LANÇAMENTO'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border bg-card rounded-2xl p-6 border shadow-sm group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-destructive/10 rounded-lg border border-destructive/20">
              <TrendingDown className="w-4 h-4 text-destructive" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Gasto Consolidado</span>
          </div>
          <div className="text-3xl font-bold text-foreground tracking-tight">
            <span className="text-sm mr-1.5 opacity-40 font-medium">R$</span>
            {totalMonthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-muted-foreground font-medium mt-4 uppercase tracking-widest opacity-60 flex items-center gap-2">
            <AlertCircle className="w-3 h-3 text-primary" /> {filteredExpenses.length} lançamentos registrados
          </p>
        </Card>

        <Card className="border-border bg-card rounded-2xl p-6 border shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-muted rounded-lg border border-border">
              <PieChart className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Categorias</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 4).map(cat => (
              <Badge key={cat} variant="outline" className="text-[8px] font-bold bg-muted/50 border-border text-muted-foreground px-2 py-0.5 rounded-full uppercase">
                {cat}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="border-border bg-card rounded-2xl p-6 border shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Landmark className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Contratos Recorrentes</span>
          </div>
          <div className="text-2xl font-bold text-foreground tracking-tight flex items-baseline gap-2">
            {expenses.filter(e => e.isRecurrent).length} <span className="text-[10px] text-muted-foreground font-medium uppercase">ativos</span>
          </div>
        </Card>
      </div>

      <Card className="border-border bg-card shadow-sm rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border bg-muted/40">
                <TableHead className="pl-8 py-5 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Data</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Descrição</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Segmento</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Valor</TableHead>
                <TableHead className="text-right pr-8 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {sortedExpenses.map((expense, idx) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={expense.id} 
                    className="group border-border hover:bg-muted/10 transition-all"
                  >
                    <TableCell className="pl-8 py-5 text-[10px] font-bold text-foreground uppercase tracking-tight">
                      {format(parseISO(expense.date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                          <Receipt className={`w-4 h-4 ${expense.isRecurrent ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold text-foreground text-sm tracking-tight uppercase leading-none">{expense.description}</div>
                          {expense.isRecurrent && (
                            <span className="text-[8px] text-primary font-bold uppercase tracking-widest">Recorrente Ativa</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[8px] font-bold bg-muted/50 border-border text-muted-foreground px-2 py-0.5 rounded-full uppercase">
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-5 px-4 font-bold text-lg tracking-tight text-destructive">
                      <span className="text-[10px] mr-1 opacity-40 font-medium text-muted-foreground">R$</span>
                      {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right pr-8 py-5">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-lg"
                          onClick={() => handleEdit(expense)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {sortedExpenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 bg-muted/5">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <Receipt className="w-10 h-10" />
                      <p className="text-xl font-bold uppercase tracking-tight">Sem lançamentos</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
