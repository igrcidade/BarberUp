import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Save, UserCircle, Store, Lock, ShieldCheck } from 'lucide-react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Account() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !user?.email) return;

    if (passwords.new.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    // Regra: Letras e Números (Alfanumérico)
    const hasLetter = /[a-zA-Z]/.test(passwords.new);
    const hasNumber = /[0-9]/.test(passwords.new);
    if (!hasLetter || !hasNumber) {
      alert('A senha deve conter letras e números.');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      alert('A nova senha e a confirmação não coincidem.');
      return;
    }

    setPassLoading(true);
    try {
      // Reautenticação necessária para troca de senha no Firebase
      const credential = EmailAuthProvider.credential(user.email, passwords.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      await updatePassword(auth.currentUser, passwords.new);
      alert('Senha alterada com sucesso!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/wrong-password') {
        alert('Senha atual incorreta.');
      } else {
        alert('Erro ao alterar senha: ' + (e.message || 'Erro desconhecido'));
      }
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500 max-w-4xl pb-10">
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
            <Store className="w-5 h-5 text-zinc-400" /> Informações do Estabelecimento
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
          
          <div className="flex justify-end border-t border-border pt-4">
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="h-10 px-8 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-widest rounded-xl text-xs"
            >
              {loading ? 'Salvando...' : (
                <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Salvar Perfil</span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SEGURANÇA: TROCA DE SENHA */}
      <Card className="bg-card border-border shadow-sm border-orange-500/10">
        <CardHeader className="bg-orange-500/5 border-b border-orange-500/10">
          <CardTitle className="text-lg font-bold uppercase tracking-tight flex items-center gap-3 text-orange-500">
            <ShieldCheck className="w-5 h-5" /> Segurança da Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Senha Atual</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                    placeholder="••••••••"
                    required
                    className="bg-muted/50 pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Nova Senha (Min. 6 Caract.)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    placeholder="Letras e Números"
                    required
                    className="bg-muted/50 pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                    placeholder="••••••••"
                    required
                    className="bg-muted/50 pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit"
                disabled={passLoading}
                className="h-10 px-8 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase tracking-widest rounded-xl text-xs"
              >
                {passLoading ? 'Alterando...' : 'Alterar Senha de Acesso'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
