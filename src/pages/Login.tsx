import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Scissors, AlertCircle, ChevronLeft, ArrowRight, Lock, Mail } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/app/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('O login por e-mail/senha não está habilitado no Firebase Console.');
      } else {
        setError('Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-lime-400/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md z-10"
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
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-lime-400" />
          <CardContent className="p-6 md:p-8 pt-6">
            <div className="mb-4 text-center md:text-left">
              <h1 className="text-2xl font-bold uppercase tracking-tight mb-1"><span className="text-[#bef264]">Acesso à</span> <span className="text-orange-500">Elite</span></h1>
              <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">Entre para gerenciar seu império</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
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

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">E-mail Corporativo</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
                  <Input
                    type="email"
                    placeholder="email@barbearia.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 rounded-xl h-10 pl-11 text-white font-bold placeholder:text-zinc-700 focus:border-orange-500 focus:ring-orange-500/20 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between ml-1">
                   <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Senha de Acesso</Label>
                   <a href="#" className="text-[10px] font-bold uppercase text-orange-500 hover:text-orange-400">Esqueceu?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 rounded-xl h-10 pl-11 text-white font-bold placeholder:text-zinc-700 focus:border-orange-500 focus:ring-orange-500/20 transition-all text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#bef264] hover:bg-[#d9f99d] text-black font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg border-none hover:scale-[1.02] active:scale-[0.98] transition-transform group mt-2"
              >
                {loading ? 'Validando...' : (
                  <span className="flex items-center gap-2">
                    Iniciar Sessão <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-white/5">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-3">Ainda não tem conta?</p>
              <Link to="/register">
                <Button variant="outline" className="w-full h-10 border-white/10 bg-transparent text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/5">
                  Criar Novo Cadastro
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-[10px] font-bold text-zinc-700 uppercase tracking-widest">
          BarberUp Premium Engine © {new Date().getFullYear()}
        </div>
      </motion.div>
    </div>
  );
}
