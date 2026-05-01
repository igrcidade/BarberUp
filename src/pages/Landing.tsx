import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Scissors, 
  TrendingUp, 
  Users, 
  Package, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  ChevronRight,
  ShieldCheck,
  Star,
  Clock,
  Smartphone
} from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Landing() {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Olá, meu nome é ${leadName}. Gostaria de conhecer mais sobre o BarberUp. Meu telefone é ${leadPhone}.`;
    window.open(`https://api.whatsapp.com/send?phone=5522998658373&text=${encodeURIComponent(text)}`, '_blank');
    setShowLeadForm(false);
    setLeadName('');
    setLeadPhone('');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const plans = [
    {
      name: 'Mensal',
      price: '79,90',
      period: '/mês',
      description: 'Ideal para quem está começando agora.',
      features: ['Gestão de Agendamentos', 'Controle Financeiro', 'PDV Completo', 'Até 2 Profissionais'],
      cta: 'Começar Agora',
      popular: false
    },
    {
      name: 'Anual',
      price: '59,90',
      period: '/mês',
      description: 'O melhor custo-benefício para sua elite.',
      features: ['Tudo do Mensal', 'Gestão de Estoque', 'Relatórios de Retenção', 'Profissionais Ilimitados', 'Suporte Prioritário'],
      cta: 'Assinar Plano Anual',
      popular: true,
      billed: 'Cobrado anualmente (R$ 718,80)'
    },
    {
      name: 'Semestral',
      price: '69,90',
      period: '/mês',
      description: 'Equilíbrio perfeito para seu crescimento.',
      features: ['Tudo do Mensal', 'Gestão de Estoque', 'Até 5 Profissionais', 'Suporte via WhatsApp'],
      cta: 'Assinar Plano Semestral',
      popular: false,
      billed: 'Cobrado semestralmente (R$ 419,40)'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-500 selection:text-black overflow-x-hidden font-sans">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-lime-400/5 rounded-full blur-[120px] animate-pulse transition-all duration-1000" />
      </div>

      {/* Header */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 bg-black/60 backdrop-blur-md border border-white/10 h-16 px-6 lg:px-8 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-lg shadow-sm">
            <Scissors className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-xl tracking-tight">BarberUp</span>
        </div>
        
        <nav className="hidden lg:flex items-center gap-8">
          {[
            { label: 'Funcionalidades', href: '#funcionalidades' },
            { label: 'Resultados', href: '#resultados' },
            { label: 'Planos', href: '#planos' },
            { label: 'Suporte', href: '#suporte' }
          ].map((item) => (
            <a key={item.label} href={item.href} className="text-xs font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" className="hidden sm:flex font-bold text-xs uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 px-4 h-9 rounded-lg">
              Entrar
            </Button>
          </Link>
          <Link to="/register">
            <Button className="bg-[#bef264] hover:bg-[#d9f99d] text-black font-bold text-xs px-6 py-2 rounded-lg shadow-sm hover:scale-[1.02] transition-transform uppercase tracking-widest h-9">
              Teste Grátis
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 lg:px-8 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center border-b border-white/5">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-8"
        >
          <motion.div variants={itemVariants}>
            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 font-bold px-3 py-1 rounded-full text-[10px] tracking-widest uppercase">
              Para Barbearias de Elite
            </Badge>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] uppercase">
            Eleve sua Gestão <br />
            <span className="text-orange-500 bg-clip-text">De Nível</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg text-zinc-400 font-medium max-w-lg leading-relaxed">
            Abandone o improviso. Tenha uma gestão cirúrgica da sua barbearia com tecnologia de ponta. Agende, venda e lucre mais com o sistema feito para o seu negócio.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link to="/register">
              <Button className="h-14 px-8 bg-[#bef264] hover:bg-[#d9f99d] text-black font-bold text-sm rounded-xl shadow-sm group uppercase tracking-widest">
                Começar Agora
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative group w-full max-w-[400px] md:max-w-md lg:max-w-[460px] mx-auto lg:ml-auto"
        >
          {/* Main Visual Image - High-end Barbershop */}
          <div className="relative z-10 rounded-3xl overflow-hidden border border-white/10 shadow-2xl h-[450px] md:h-[550px] w-full">
            <img 
              src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop" 
              alt="Premium Barbershop" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <div className="absolute bottom-8 left-8 right-8 space-y-3">
              <Badge className="bg-lime-400 text-black font-bold uppercase text-[9px] tracking-widest px-2 py-0.5 border-none">Case de Sucesso</Badge>
              <h3 className="text-2xl font-bold uppercase leading-tight">Vip <br /> <span className="text-orange-500">Barbershop</span></h3>
              <p className="text-zinc-300 font-medium text-sm leading-snug">"Desde que comecei a usar o app, o faturamento cresceu 40%."</p>
            </div>
          </div>

          {/* Floating Card */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-6 -left-6 z-20 bg-black/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl flex items-center gap-3"
          >
            <div className="bg-lime-400 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Faturamento Hoje</div>
              <div className="text-lg font-bold text-white tracking-tight">R$ 4.280,00</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Sections */}
      <section id="funcionalidades" className="py-24 px-6 lg:px-8 bg-zinc-900/30 border-b border-white/5">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1 relative max-w-md mx-auto w-full">
            <div className="rounded-3xl overflow-hidden border border-white/10 relative shadow-xl group">
              <img 
                src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1976&auto=format&fit=crop" 
                alt="Management detail" 
                className="w-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-orange-500 p-5 rounded-2xl shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <Badge className="bg-white/5 text-zinc-400 border-white/10 font-bold px-3 py-1 text-[10px] uppercase tracking-widest">Controle Total</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">Dê adeus à <br /> <span className="text-orange-500">comanda de papel</span></h2>
            <p className="text-base text-zinc-400 font-medium leading-relaxed">
              Otimize cada segundo. No BarberUp você lida com fechamento de caixa, comissões automáticas para sua equipe e mantem o histórico completo de clientes a poucos cliques.
            </p>
            <ul className="space-y-3 pt-2">
              {[
                'Agendamento Online Integrado',
                'Controle de Estoque e Comissões',
                'Dashboard Financeiro',
                'Relatórios de Performance'
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-white font-bold uppercase tracking-tight text-xs">
                  <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Resultados Section */}
      <section id="resultados" className="py-24 px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/5">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">O que dizem os <br /> <span className="text-orange-500">nossos clientes</span></h2>
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Veja quem transformou a barbearia com o BarberUp</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { 
              name: 'Thiago Oliveira', 
              text: 'A gestão ficou tão leve que tive tempo para abrir minha segunda unidade. O app é essencial.',
              image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1976&auto=format&fit=crop'
            },
            { 
              name: 'Ricardo Mello', 
              text: 'Controlar as comissões dos 5 barbeiros era um pesadelo. Hoje o sistema faz tudo sem margem de erro.',
              image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop'
            },
            { 
              name: 'Carlos Santos', 
              text: 'Meus clientes amam o agendamento fácil. A taxa de retorno subiu absurdamente no último mês.',
              image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=2070&auto=format&fit=crop'
            }
          ].map((item, i) => (
            <motion.div 
              key={item.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-zinc-900/50 border border-white/5 p-8 rounded-2xl space-y-5 hover:bg-zinc-900 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold uppercase text-sm tracking-tight">{item.name}</div>
                  <div className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">Cliente BarberUp</div>
                </div>
              </div>
              <p className="text-zinc-400 font-medium text-sm leading-relaxed">"{item.text}"</p>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-lime-400 text-lime-400" />)}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-24 px-6 lg:px-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-[#bef264]/10 text-lime-400 border-[#bef264]/20 font-bold px-3 py-1 text-[10px] uppercase tracking-widest">Planos</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">Gestão de Elite <br /> ao seu <span className="text-orange-500">alcance</span></h2>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Escolha o plano ideal para a sua barbearia</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div 
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`relative p-8 rounded-3xl border flex flex-col justify-between ${
                  plan.popular 
                  ? 'bg-zinc-900 border-orange-500 shadow-sm relative' 
                  : 'bg-zinc-900/30 border-white/5'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-black font-bold uppercase text-[9px] px-4 py-1 rounded-full tracking-widest shadow-sm">
                    Recomendado
                  </div>
                )}
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold uppercase tracking-tight text-white mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-xs font-medium text-zinc-400 min-h-[40px]">
                      {plan.description}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold tracking-tight text-white">
                      R$ {plan.price}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      {plan.period}
                    </span>
                  </div>

                  {plan.billed && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      {plan.billed}
                    </p>
                  )}

                  <div className="h-px w-full bg-white/5" />

                  <ul className="space-y-3">
                    {plan.features.map(feat => (
                      <li key={feat} className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight text-zinc-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link to={`/register?plan=${plan.name.toLowerCase()}`} className="mt-8">
                  <Button className={`w-full h-12 rounded-xl font-bold text-xs uppercase tracking-widest ${
                    plan.popular ? 'bg-orange-500 hover:bg-orange-600 text-black border-none' : 'bg-white hover:bg-zinc-200 text-black border-none'
                  }`}>
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Suporte Section */}
      <section id="suporte" className="py-24 px-6 lg:px-8 border-b border-white/5">
        <div className="max-w-5xl mx-auto rounded-3xl bg-zinc-900 border border-white/5 p-8 md:p-16 hover:border-white/10 transition-colors">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-center md:text-left">
              <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 font-bold px-3 py-1 text-[10px] uppercase tracking-widest">Suporte</Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight uppercase">Não te deixamos <br /> na <span className="text-orange-500">mão</span></h2>
              <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                Nossa equipe está pronta para te atender via WhatsApp e ajudar a migrar seus dados, treinar a equipe e colocar o sistema para rodar.
              </p>
              <Button onClick={() => setShowLeadForm(true)} className="h-12 px-6 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-xs rounded-xl flex items-center gap-2 uppercase tracking-widest mx-auto md:mx-0 shadow-lg">
                <Smartphone className="w-4 h-4" />
                Falar com Especialista
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/50 p-6 rounded-2xl border border-white/5 flex flex-col items-center md:items-start text-center md:text-left gap-3">
                <Clock className="w-6 h-6 text-orange-500" />
                <div>
                  <div className="font-bold uppercase tracking-tight text-sm">Respostas Rápidas</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Chat Humanizado</div>
                </div>
              </div>
              <div className="bg-black/50 p-6 rounded-2xl border border-white/5 flex flex-col items-center md:items-start text-center md:text-left gap-3">
                <ShieldCheck className="w-6 h-6 text-lime-400" />
                <div>
                  <div className="font-bold uppercase tracking-tight text-sm">Sempre Disponível</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Uptime 99.9%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 lg:px-8 text-center max-w-4xl mx-auto">
        <div className="space-y-8">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight uppercase">
            Transforme sua  <br /> <span className="text-orange-500">Gestão hoje</span>
          </h2>
          <p className="text-sm text-zinc-400 font-bold uppercase tracking-widest">Inicie seu teste de 7 dias grátis.</p>
          <Link to="/register" className="inline-block mt-4">
            <Button className="h-14 px-10 bg-white text-black hover:bg-zinc-200 font-bold text-sm rounded-xl uppercase tracking-widest transition-colors flex items-center gap-2">
              Criar Conta Gratuita <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-8 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-lg">BarberUp</span>
          </div>
          <div className="flex gap-6">
            <button type="button" onClick={() => setShowPrivacy(true)} className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest">Privacidade</button>
            <button type="button" onClick={() => setShowTerms(true)} className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest">Termos e Condições</button>
            <a href="#" className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest">Contato</a>
          </div>
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center md:text-right">
            © {new Date().getFullYear()} BarberUp. Todos os direitos reservados.
          </div>
        </div>
      </footer>

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

      {/* Lead Form Dialog */}
      <Dialog open={showLeadForm} onOpenChange={setShowLeadForm}>
        <DialogContent className="max-w-md bg-[#0a0a0a] border-white/10 text-white shadow-2xl rounded-3xl">
          <DialogHeader className="border-b border-white/10 pb-6 mb-6">
            <DialogTitle className="text-2xl font-bold uppercase tracking-tight text-white mb-2">Fale com Especialista</DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
              Nossa equipe entrará em contato com você pelo WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLeadSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Seu Nome</Label>
              <Input
                type="text"
                placeholder="Ex: João Silva"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                required
                className="bg-white/5 border-white/10 rounded-xl h-12 text-white font-bold placeholder:text-zinc-700 focus:border-[#25D366] transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Seu WhatsApp</Label>
              <Input
                type="tel"
                placeholder="(22) 99999-9999"
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
                required
                className="bg-white/5 border-white/10 rounded-xl h-12 text-white font-bold placeholder:text-zinc-700 focus:border-[#25D366] transition-all"
              />
            </div>
            <div className="pt-4">
              <Button type="submit" className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-xs uppercase tracking-widest rounded-xl h-12">
                Enviar Mensagem
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
