import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  MapPin,
  Stethoscope,
  Ambulance,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  Phone,
  LayoutDashboard,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Activity,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

export default function Header() {
  const { user, signOut, userRole } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [location] = useLocation();

  const getNavigation = () => {
    if (userRole === 'patient') {
      return [
        { name: "Home", href: "/" },
        { name: "Find Clinics", href: "/patients" },
        { name: "Symptoms", href: "/symptom-analysis" },
        { name: "Passport", href: "/profile" },
        { name: "Queue", href: "/queue-status" },
      ];
    }
    return [
      { name: "Home", href: "/" },
      { name: "For Clinics", href: "/clinics" },
      { name: "About", href: "/about" },
    ];
  };

  const navigation = getNavigation();

  const emergencyServices = [
    { name: "Ambulance", number: "108", description: "Medical Emergency" },
    { name: "Police", number: "100", description: "Security Emergency" },
    { name: "Fire", number: "101", description: "Fire Emergency" },
    { name: "Helpline", number: "1091", description: "Women/Child Support" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-[100] bg-white/70 backdrop-blur-2xl border-b border-white/20 shadow-sm"
    >
      <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
            <MapPin className="text-white h-5 w-5" />
            <Activity className="absolute -bottom-1 -right-1 text-emerald-400 bg-slate-900 rounded-full h-4 w-4 p-0.5 border border-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black text-slate-900 leading-none">FindMyClinic</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Health on Demand</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-black transition-all",
                  location === item.href ? "text-primary bg-primary/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                {item.name}
              </Button>
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Dialog open={isEmergencyOpen} onOpenChange={setIsEmergencyOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="h-10 px-6 rounded-xl font-black shadow-lg shadow-red-200 animate-pulse active:scale-95 transition-all">
                <ShieldAlert className="h-4 w-4 mr-2" /> Emergency
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-none max-w-sm rounded-3xl p-8">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-3xl font-black text-rose-600 flex items-center gap-2">
                  Critical Care
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {emergencyServices.map((service) => (
                  <Button
                    key={service.name}
                    onClick={() => window.location.href = `tel:${service.number}`}
                    variant="outline"
                    className="w-full h-16 justify-between rounded-2xl border-slate-100 hover:border-rose-200 hover:bg-rose-50 px-6 group transition-all active:scale-95"
                  >
                    <div className="text-left">
                      <p className="font-black text-slate-900">{service.name}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{service.description}</p>
                    </div>
                    <div className="h-10 w-10 bg-rose-500 text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Phone className="h-5 w-5" />
                    </div>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button className="h-10 px-6 rounded-xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-all active:scale-95 shadow-xl">
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => signOut()} className="rounded-xl text-slate-400 hover:text-rose-500">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Link href="/auth">
              <Button className="h-10 px-8 rounded-xl bg-primary text-white font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                Join Platform
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Buttons */}
        <div className="flex md:hidden items-center gap-3">
          <Button variant="destructive" size="icon" className="h-10 w-10 rounded-xl animate-pulse" onClick={() => setIsEmergencyOpen(true)}>
            <ShieldAlert className="h-5 w-5" />
          </Button>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-900 active:scale-90 transition-transform">
            {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-3xl overflow-hidden border-t border-slate-100"
          >
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-2">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href} onClick={() => setIsMenuOpen(false)}>
                    <div className={cn(
                      "flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98]",
                      location === item.href ? "bg-primary text-white" : "bg-slate-50 text-slate-900"
                    )}>
                      <span className="font-black text-lg">{item.name}</span>
                      <ChevronRight className={cn("h-5 w-5", location === item.href ? "text-white/50" : "text-slate-300")} />
                    </div>
                  </Link>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100">
                {user ? (
                  <div className="space-y-3">
                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black text-lg shadow-xl active:scale-95 transition-all">
                        View My Dashboard
                      </Button>
                    </Link>
                    <Button variant="ghost" onClick={() => { signOut(); setIsMenuOpen(false); }} className="w-full text-slate-400 font-bold">
                      Log Out System
                    </Button>
                  </div>
                ) : (
                  <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full h-14 rounded-2xl bg-primary text-white font-black text-lg shadow-xl active:scale-95 transition-all">
                      Login / Get Started
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
