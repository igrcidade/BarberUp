import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Scissors, AlertCircle, ChevronLeft, ArrowRight, User, Mail, Lock, Building, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function Register() {
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const searchParams = new URLSearchParams(location.search);
  const selectedPlan = searchParams.get('plan');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!email.includes('@') || !email.includes('.')) {
      setError('Por favor, insira um e-mail válido.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    // Regra: Letras e Números (Alfanumérico)
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      setError('A senha deve conter obrigatoriamente letras e números.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name
      });

      await setDoc(doc(db, 'users', user.uid), {
        name,
        barbershopName: shopName,
        email: email.trim(),
        role: 'admin',
        subscriptionPlan: selectedPlan || 'trial',
        subscriptionStatus: selectedPlan ? 'pending' : 'trial',
        subscriptionEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      });

      if (selectedPlan) {
        navigate(`/checkout?plan=${selectedPlan}`);
      } else {
        navigate('/app/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/network-request-failed') {
        setError('Erro de conexão. Se você estiver no modo de visualização (iframe) e seu navegador bloquear cookies de terceiros, tente "Abrir em nova aba" ou desativar o bloqueio.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('O cadastro por e-mail/senha não está habilitado no Firebase Console.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError(err.message || 'Ocorreu um erro ao criar sua conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-lime-400/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-xl z-10"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest mb-6 group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para Início
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-orange-500 p-2 rounded-xl shadow-lg shadow-orange-500/20">
            <Scissors className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-2xl tracking-tighter">BarberUp</span>
        </div>

        <Card className="bg-white/[0.03] border-white/5 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-lime-400 to-orange-500" />
          <CardContent className="p-5 md:p-6 pb-4">
            <div className="mb-4 text-center md:text-left">
              {selectedPlan ? (
                <>
                  <h1 className="text-2xl font-bold uppercase tracking-tight mb-1"><span className="text-orange-500">CONTRATAR</span> <span className="text-[#bef264]">PLANO</span></h1>
                  <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">Crie sua conta para prosseguir com o pagamento</p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold uppercase tracking-tight mb-1"><span className="text-orange-500">TESTE</span> <span className="text-[#bef264]">GRÁTIS</span></h1>
                  <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">Comece a dominar o mercado em 2 minutos</p>
                </>
              )}
            </div>

            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-500 p-2 rounded-xl flex items-center gap-2 text-xs font-bold"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Seu Nome Completo</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-[#bef264] transition-colors" />
                    <Input
                      type="text"
                      autoComplete="name"
                      placeholder="Ex: João Barber"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 rounded-xl h-10 pl-11 text-white font-bold placeholder:text-zinc-700 focus:border-[#bef264] focus:ring-[#bef264]/20 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Nome da Barbearia</Label>
                  <div className="relative group">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-[#bef264] transition-colors" />
                    <Input
                      type="text"
                      autoComplete="organization"
                      placeholder="Ex: Gold Cuts"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 rounded-xl h-10 pl-11 text-white font-bold placeholder:text-zinc-700 focus:border-[#bef264] focus:ring-[#bef264]/20 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Seu E-mail</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-[#bef264] transition-colors" />
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="email@barber.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 rounded-xl h-10 pl-11 text-white font-bold placeholder:text-zinc-700 focus:border-[#bef264] focus:ring-[#bef264]/20 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Senha (Letras e Números)</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-[#bef264] transition-colors" />
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Min. 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 rounded-xl h-10 pl-11 text-white font-bold placeholder:text-zinc-700 focus:border-[#bef264] focus:ring-[#bef264]/20 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Confirmar Senha</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-[#bef264] transition-colors" />
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repita sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 rounded-xl h-10 pl-11 text-white font-bold placeholder:text-zinc-700 focus:border-[#bef264] focus:ring-[#bef264]/20 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#bef264] hover:bg-[#d9f99d] text-black font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg border-none hover:scale-[1.01] active:scale-[0.99] transition-transform group"
                >
                  {loading ? (selectedPlan ? 'Preparando Checkout...' : 'Preparando Seu Império...') : (
                    <span className="flex items-center gap-2">
                      {selectedPlan ? <><CreditCard className="w-4 h-4" /> CRIAR CONTA E PAGAR</> : 'CRIAR MINHA BARBEARIA'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
                <p className="mt-3 text-center text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">
                  Ao clicar em cadastrar, você concorda com nossos <br className="hidden md:block" />
                  <button type="button" onClick={() => setShowTerms(true)} className="text-zinc-400 hover:text-white underline">Termos de Uso</button> e <button type="button" onClick={() => setShowPrivacy(true)} className="text-zinc-400 hover:text-white underline">Políticas de Privacidade</button>.
                </p>
              </div>
            </form>

            <div className="mt-4 pt-4 border-t border-white/5 text-center">
              <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1">Já tem uma barbearia no BarberUp?</p>
              <Link to="/login">
                <Button variant="ghost" className="text-orange-500 hover:text-orange-400 font-bold text-[10px] uppercase tracking-widest h-auto p-0">
                  Acessar Painel de Controle
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Terms Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-2xl bg-[#0a0a0a] border-white/10 text-white shadow-2xl rounded-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-white/10 pb-6 mb-6">
            <DialogTitle className="text-2xl font-bold uppercase tracking-tight text-white mb-2">Termos de Uso</DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
            <section>
              <h3 className="text-orange-500 font-bold uppercase tracking-tight mb-2">1. Aceitação dos Termos</h3>
              <p>Ao acessar e utilizar o sistema BarberUp, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.</p>
            </section>
            <section>
              <h3 className="text-orange-500 font-bold uppercase tracking-tight mb-2">2. Uso do Serviço</h3>
              <p>O BarberUp fornece ferramentas de gestão exclusivas para barbearias. Você é responsável por manter a confidencialidade das informações da sua conta e de todas as atividades que ocorrem sob a sua senha.</p>
            </section>
            <section>
              <h3 className="text-orange-500 font-bold uppercase tracking-tight mb-2">3. Dados e Privacidade</h3>
              <p>A coleta e uso de dados pessoais estão descritos na nossa Política de Privacidade. Ao preencher dados de clientes, o usuário garante ter o consentimento necessário dos mesmos.</p>
            </section>
            <section>
              <h3 className="text-orange-500 font-bold uppercase tracking-tight mb-2">4. Pagamentos e Assinaturas</h3>
              <p>O uso além do período de teste gratuito exige o pagamento de uma assinatura. A inadimplência poderá resultar na suspensão temporária do acesso à plataforma.</p>
            </section>
            <section>
              <h3 className="text-orange-500 font-bold uppercase tracking-tight mb-2">5. Modificações dos Termos</h3>
              <p>O BarberUp reserva-se o direito de alterar estes termos a qualquer momento, notificando seus usuários sobre mudanças significativas através do e-mail cadastrado.</p>
            </section>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
            <Button onClick={() => setShowTerms(false)} className="bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs uppercase tracking-widest px-8">
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Dialog */}
      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
        <DialogContent className="max-w-2xl bg-[#0a0a0a] border-white/10 text-white shadow-2xl rounded-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-white/10 pb-6 mb-6">
            <DialogTitle className="text-2xl font-bold uppercase tracking-tight text-white mb-2">Políticas de Privacidade</DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
            <section>
              <h3 className="text-lime-400 font-bold uppercase tracking-tight mb-2">1. Coleta de Informações</h3>
              <p>Coletamos informações que você nos fornece diretamente ao criar uma conta, como nome, e-mail e dados da barbearia. Também coletamos dados inseridos por você sobre seus clientes, como nome, telefone e histórico de serviços.</p>
            </section>
            <section>
              <h3 className="text-lime-400 font-bold uppercase tracking-tight mb-2">2. Uso das Informações</h3>
              <p>Utilizamos as informações para fornecer, manter e melhorar nossos serviços, além de processar transações, enviar avisos técnicos e alertas de segurança.</p>
            </section>
            <section>
              <h3 className="text-lime-400 font-bold uppercase tracking-tight mb-2">3. Proteção de Dados</h3>
              <p>Implementamos medidas de segurança reconhecidas pelo mercado para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.</p>
            </section>
            <section>
              <h3 className="text-lime-400 font-bold uppercase tracking-tight mb-2">4. Compartilhamento de Dados</h3>
              <p>Não vendemos ou transferimos seus dados pessoais a terceiros, exceto quando necessário para a operação da plataforma ou exigido por lei. Dados agregados e anonimizados podem ser usados para estatísticas gerais.</p>
            </section>
            <section>
              <h3 className="text-lime-400 font-bold uppercase tracking-tight mb-2">5. Seus Direitos</h3>
              <p>Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento através do painel de configurações do sistema ou solicitando suporte.</p>
            </section>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
            <Button onClick={() => setShowPrivacy(false)} className="bg-lime-500 hover:bg-lime-600 text-black font-bold text-xs uppercase tracking-widest px-8">
              Estou Ciente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
