import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Scissors, 
  Package, 
  Users, 
  ShoppingCart, 
  Receipt, 
  UserMinus, 
  LogOut,
  Sun,
  Moon,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../lib/auth';

const getMenuItems = (isAdmin: boolean) => {
  const items = [
    { title: 'Vender', icon: ShoppingCart, path: '/app/sales', highlight: true },
    { title: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
    { title: 'Serviços', icon: Scissors, path: '/app/services' },
    { title: 'Produtos', icon: Package, path: '/app/products' },
    { title: 'Clientes', icon: Users, path: '/app/clients' },
    { title: 'Despesas', icon: Receipt, path: '/app/expenses' },
    { title: 'Retenção', icon: UserMinus, path: '/app/retention' }
  ];

  if (isAdmin) {
    items.push({ title: 'Admin Master', icon: ShieldCheck, path: '/app/master-admin', highlight: false });
  }
  
  return items;
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isActive } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = getMenuItems(isAdmin);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background transition-colors duration-500 font-sans selection:bg-primary selection:text-primary-foreground">
        {/* Decorative background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]" />
        </div>

        <Sidebar className="border-r border-border bg-card lg:w-72">
          <SidebarHeader className="p-8">
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/app/dashboard')}>
              <div className="bg-primary p-2.5 rounded-xl shadow-md group-hover:shadow-lg transition-all">
                <Scissors className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-foreground text-xl tracking-tight leading-none">BarberUp</span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1 opacity-80">Premium Saas</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3">
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-4 opacity-50">Módulos de Gestão</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">
                  {menuItems.map((item) => {
                    const isItemActive = location.pathname === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton 
                          render={<Link to={item.path} className="flex items-center gap-3 w-full" />}
                          isActive={isItemActive}
                          tooltip={item.title}
                          className={`
                            group h-11 rounded-xl transition-all duration-300 px-3
                            ${isItemActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                          `}
                        >
                          <div className={`
                            p-1.5 rounded-lg transition-all
                            ${isItemActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}
                          `}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-xs tracking-tight uppercase">{item.title}</span>
                          {item.highlight && !isItemActive && (
                            <Badge variant="secondary" className="ml-auto text-[8px] px-1.5 py-0 rounded-md font-bold uppercase">PDV</Badge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-6 mt-auto">
            <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <Avatar className="h-9 w-9 border border-border shadow-sm">
                    <AvatarImage src={user?.photoURL || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold text-foreground truncate leading-none mb-1 uppercase tracking-tight">
                      {user?.displayName || 'Usuário'}
                    </span>
                    <span className="text-[9px] font-bold text-primary uppercase tracking-wider opacity-80">Cliente BarberUp</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg transition-all"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start h-10 px-3 gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent rounded-xl font-bold text-[10px] uppercase tracking-widest group"
                onClick={handleLogout}
              >
                <LogOut className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                Sair do Sistema
              </Button>
            </div>
            
            <div className="mt-4 px-2 py-1 flex items-center justify-center gap-2 opacity-20 select-none border-t border-border/50 pt-4">
              <span className="text-[8px] font-bold tracking-widest uppercase">BarberUp v4.0</span>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset className="flex w-full flex-col bg-transparent relative z-0">
          <header className="flex h-16 items-center justify-between px-6 gap-4 sticky top-0 z-50 lg:hidden bg-background/80 backdrop-blur-md border-b border-border">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-foreground" />
              <div className="font-bold text-foreground tracking-tight text-lg uppercase">
                {menuItems.find(item => item.path === location.pathname)?.title || 'Painel'}
              </div>
            </div>
            <div className="bg-primary p-2 rounded-lg shadow-sm">
              <Scissors className="w-4 h-4 text-primary-foreground" />
            </div>
          </header>
          
          <main className="flex-1 p-4 md:p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <div className="max-w-[1600px] mx-auto">
              {!isActive && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-red-500">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <h4 className="font-bold uppercase tracking-tight text-sm">Assinatura Inativa</h4>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">Renove seu plano para voltar a registrar vendas e usar todos os recursos.</p>
                    </div>
                  </div>
                  <Link to="/checkout">
                    <Button className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-widest shrink-0">
                      Renovar Agora
                    </Button>
                  </Link>
                </div>
              )}
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
