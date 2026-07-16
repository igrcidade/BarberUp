/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Reset window scroll
    window.scrollTo(0, 0);
    
    // Reset standard containers scroll
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    
    // Target main layout container specifically if it exists
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTop = 0;
      mainContent.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
import { auth } from './lib/firebase';
import { ShieldCheck, Mail } from 'lucide-react';
import { Button } from './components/ui/button';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster, toast } from 'sonner';

const Landing = React.lazy(() => import('./pages/Landing'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Services = React.lazy(() => import('./pages/Services'));
const Products = React.lazy(() => import('./pages/Products'));
const Clients = React.lazy(() => import('./pages/Clients'));
const Sales = React.lazy(() => import('./pages/Sales'));
const Expenses = React.lazy(() => import('./pages/Expenses'));
const Retention = React.lazy(() => import('./pages/Retention'));
const MasterAdmin = React.lazy(() => import('./pages/MasterAdmin'));
const CheckoutPlan = React.lazy(() => import('./pages/CheckoutPlan'));
const CheckoutSuccess = React.lazy(() => import('./pages/CheckoutSuccess'));
const Subscription = React.lazy(() => import('./pages/Subscription'));
const Account = React.lazy(() => import('./pages/Account'));
const Barbers = React.lazy(() => import('./pages/Barbers'));
const Layout = React.lazy(() => import('./components/Layout'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, isAdmin, isActive, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  // Require email verification, unless it's Master Admin or on the checkout path
  const creationTime = user.metadata?.creationTime ? new Date(user.metadata.creationTime).getTime() : 0;
  const isLegacyUser = creationTime > 0 && creationTime < new Date('2026-05-09T02:10:00Z').getTime();
  const isCheckoutPath = location.pathname.includes('/checkout');

  if (!user.emailVerified && !isAdmin && !isLegacyUser && !isCheckoutPath) {
    const handleResend = async () => {
      let customEmailSent = false;
      try {
        const mailRes = await fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: profile?.name || user.displayName || 'Usuário',
            shopName: profile?.barbershopName || 'sua barbearia'
          })
        });
        if (mailRes.ok) {
          customEmailSent = true;
          toast.success('E-mail reenviado com sucesso! Verifique sua caixa de entrada e spam.');
        } else {
          console.error('Erro ao reenviar e-mail customizado.');
        }
      } catch (e) {
        console.error('Erro de rede ao reenviar e-mail customizado.', e);
      }

      if (!customEmailSent) {
        try {
          // Fallback
          const { sendEmailVerification } = await import('firebase/auth');
          await sendEmailVerification(user);
          toast.success('E-mail padrão reenviado com sucesso! Verifique sua caixa de entrada e spam.');
        } catch (fbError: any) {
          console.error('Erro no fallback de e-mail:', fbError);
          // Adicionamos wait se o erro for too-many-requests
          if (fbError.code === 'auth/too-many-requests') {
            toast.error('Muitas tentativas. Aguarde um momento antes de tentar novamente.');
          } else {
            toast.error('Erro ao reenviar e-mail de confirmação.');
          }
        }
      }
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center text-orange-500 mx-auto shadow-2xl">
            <Mail className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">E-MAIL NÃO VERIFICADO</h1>
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground leading-relaxed">
              Verifique sua caixa de entrada e confirme seu e-mail para acessar o BarberUp.
            </p>
          </div>
          <div className="space-y-3">
            <Button 
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black uppercase tracking-widest"
              onClick={() => {
                auth.signOut();
                window.location.href = '/login';
              }}
            >
              VOLTAR PARA O LOGIN
            </Button>
            <Button 
              variant="outline"
              className="w-full h-12 border-orange-500/20 text-orange-500 hover:bg-orange-500/10 rounded-xl font-black uppercase tracking-widest"
              onClick={handleResend}
            >
              REENVIAR E-MAIL DE CONFIRMAÇÃO
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Se for Master Admin, acesso total sempre
  if (isAdmin) return <>{children}</>;

  // Se o status for bloqueado, trava total
  if (profile?.subscriptionStatus === 'blocked') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center text-destructive mx-auto shadow-2xl">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">ACESSO BLOQUEADO</h1>
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground leading-relaxed">
              Sua conta foi desativada pela administração. Entre em contato com o suporte para regularizar sua situação.
            </p>
          </div>
          <Button 
            className="w-full barber-button-primary h-12 rounded-xl font-black uppercase tracking-widest"
            onClick={() => auth.signOut()}
          >
            VOLTAR AO INÍCIO
          </Button>
        </div>
      </div>
    );
  }

  // Se não estiver ativo (ex: expirado), só pode acessar a página de assinatura
  const isSubscriptionPath = location.pathname.includes('/subscription') || location.pathname.includes('/checkout');
  if (!isActive && !isSubscriptionPath) {
    return <Navigate to="/app/subscription" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="barberup-theme">
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Toaster position="top-right" richColors theme="dark" />
          <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPlan /></ProtectedRoute>} />
              <Route path="/checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
              <Route
                path="/app/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/clients" element={<Clients />} />
                        <Route path="/sales" element={<Sales />} />
                        <Route path="/expenses" element={<Expenses />} />
                        <Route path="/retention" element={<Retention />} />
                        <Route path="/subscription" element={<Subscription />} />
                        <Route path="/account" element={<Account />} />
                        <Route path="/barbers" element={<Barbers />} />
                        <Route path="/master-admin" element={<MasterAdmin />} />
                        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
