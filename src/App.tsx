/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { auth } from './lib/firebase';
import { ShieldCheck } from 'lucide-react';
import { Button } from './components/ui/button';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from 'sonner';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Products from './pages/Products';
import Clients from './pages/Clients';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Retention from './pages/Retention';
import MasterAdmin from './pages/MasterAdmin';
import CheckoutPlan from './pages/CheckoutPlan';
import CheckoutSuccess from './pages/CheckoutSuccess';
import Subscription from './pages/Subscription';
import Account from './pages/Account';
import Barbers from './pages/Barbers';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, isAdmin, isActive, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

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
          <Toaster position="top-right" richColors theme="dark" />
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
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
