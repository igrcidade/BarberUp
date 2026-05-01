/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './components/ThemeProvider';
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
import Layout from './components/Layout';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="barberup-theme">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPlan /></ProtectedRoute>} />
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
