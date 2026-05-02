import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Save, UserCircle, Store, Clock } from 'lucide-react';

export default function Account() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    document: '', // CPF/CNPJ
    address: '',
    operatingHours: ''
  });

  useEffect(() => {
    async function loadProfile() {
      if (!user?.uid) return;
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          document: data.document || '',
          address: data.address || '',
          operatingHours: data.operatingHours || ''
        });
      }
    }
    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const ref = doc(db, 'users', user.uid);
      await updateDoc(ref, {
        name: formData.name,
        phone: formData.phone,
        document: formData.document,
        address: formData.address,
        operatingHours: formData.operatingHours
      });
      alert('Perfil atualizado com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500 max-w-4xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold uppercase tracking-tighter text-foreground">Minha Conta</h1>
        <p className="text-muted-foreground text-sm font-medium">Gerencie seu perfil, documentos e informações do negócio</p>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="text-lg font-bold uppercase tracking-tight flex items-center gap-3">
            <UserCircle className="w-5 h-5 text-primary" /> Dados Pessoais e Jurídicos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Nome da Barbearia / Titular</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: BarberUp Studio"
                className="bg-muted/50 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">CPF / CNPJ</Label>
              <Input 
                value={formData.document}
                onChange={(e) => setFormData({...formData, document: e.target.value})}
                placeholder="000.000.000-00 ou 00.000.000/0001-00"
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">E-mail de Acesso</Label>
              <Input 
                value={user?.email || ''}
                readOnly
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">WhatsApp / Telefone</Label>
              <Input 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="(00) 00000-0000"
                className="bg-muted/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="text-lg font-bold uppercase tracking-tight flex items-center gap-3">
            <Store className="w-5 h-5 text-secondary-foreground" /> Informações do Estabelecimento
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Endereço Completo</Label>
              <Input 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Ex: Rua das Flores, 123 - Centro"
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                 Horário de Funcionamento
              </Label>
              <Input 
                value={formData.operatingHours}
                onChange={(e) => setFormData({...formData, operatingHours: e.target.value})}
                placeholder="Ex: Seg a Sab das 09:00 às 20:00"
                className="bg-muted/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest rounded-xl"
        >
          {loading ? 'Salvando...' : (
            <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Salvar Alterações</span>
          )}
        </Button>
      </div>

    </div>
  );
}
