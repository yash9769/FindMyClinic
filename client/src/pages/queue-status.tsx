import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Ticket, Clock, MapPin, User, Activity, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface QueueToken {
  id: string;
  token_number: number;
  status: string;
  estimated_wait_time: number | null;
  created_at: string;
  clinic: {
    name: string;
    address: string;
    phone: string;
  };
  doctor: {
    name: string;
    specialization: string;
  };
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function QueueStatus() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tokenNumber, setTokenNumber] = useState("");
  const [queueToken, setQueueToken] = useState<QueueToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!tokenNumber.trim()) {
      toast({ title: "Token Required", description: "Please enter your number", variant: "destructive" });
      return;
    }
    setLoading(true);
    setSearched(false);
    try {
      const { data, error } = await supabase
        .from('queue_tokens')
        .select(`id, token_number, status, estimated_wait_time, created_at, clinic:clinics ( name, address, phone ), doctor:doctors ( name, specialization )`)
        .eq('token_number', parseInt(tokenNumber))
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setQueueToken({
          ...data,
          clinic: Array.isArray(data.clinic) ? data.clinic[0] : data.clinic,
          doctor: Array.isArray(data.doctor) ? data.doctor[0] : data.doctor
        } as any);
      } else {
        setQueueToken(null);
      }
    } catch (error) {
      toast({ title: "Network Error", variant: "destructive" });
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'called': return 'bg-primary/10 text-primary border-primary-200';
      case 'completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      default: return 'bg-rose-500/10 text-rose-600 border-rose-200';
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden mesh-gradient pb-10">
      <div className="noise"></div>

      <div className="container mx-auto px-4 py-8 md:py-16 relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div {...fadeInUp} className="mb-8 md:mb-12">
            <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 md:mb-8 font-black hover:bg-white text-slate-500">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <div className="text-center">
              <Badge className="mb-4 px-3 py-1 bg-primary text-white border-none text-[9px] font-black rounded-full uppercase tracking-tighter shadow-lg shadow-primary/20">Real-Time Tracker</Badge>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-2 tracking-tighter">Queue <span className="text-gradient">Portal</span></h1>
              <p className="text-sm md:text-lg text-slate-500 font-bold px-4">Track your position live from your smartphone.</p>
            </div>
          </motion.div>

          {/* Search Card */}
          <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="mb-8">
            <Card className="glass-card border-none overflow-hidden p-6 md:p-8 shadow-2xl">
              <div className="flex flex-col gap-6">
                <div className="space-y-2">
                  <Label className="font-black text-slate-400 uppercase tracking-widest text-[9px] ml-1">Token Identifier</Label>
                  <div className="relative">
                    <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <Input
                      type="number"
                      placeholder="e.g. 1024"
                      value={tokenNumber}
                      onChange={(e) => setTokenNumber(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="h-14 md:h-16 pl-12 rounded-xl md:rounded-2xl border-slate-100 bg-slate-50/50 text-xl font-black focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="h-14 md:h-16 rounded-xl md:rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-base md:text-lg shadow-xl active:scale-95 transition-all"
                >
                  {loading ? <Activity className="h-5 w-5 animate-spin mr-2" /> : "Verify Status"}
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Results Area */}
          <AnimatePresence mode="wait">
            {searched && (
              <motion.div key={queueToken?.id || 'empty'} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}>
                {queueToken ? (
                  <Card className="glass-card border-none overflow-hidden relative shadow-2xl">
                    <div className="h-1.5 bg-gradient-to-r from-primary to-secondary"></div>
                    <CardHeader className="p-6 md:p-10 pb-4">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                        <div className="flex items-center gap-4 md:gap-6">
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-900 text-white rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col items-center justify-center shadow-lg">
                            <span className="text-[8px] md:text-[10px] font-black opacity-40 uppercase">Token</span>
                            <span className="text-xl md:text-3xl font-black">#{queueToken.token_number}</span>
                          </div>
                          <div className="text-center sm:text-left">
                            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Active Reference</h3>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-tighter">Verified {new Date(queueToken.created_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <Badge className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase border-none tracking-widest ${getStatusStyle(queueToken.status)}`}>
                          {queueToken.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 md:p-10 pt-0 space-y-8">
                      <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                        <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
                          <MapPin className="h-5 w-5 text-slate-300 mb-3" />
                          <h4 className="text-lg font-black text-slate-900 line-clamp-1">{queueToken.clinic.name}</h4>
                          <p className="text-[10px] font-black text-slate-400 mt-1 uppercase truncate">{queueToken.clinic.address}</p>
                        </div>
                        <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
                          <User className="h-5 w-5 text-slate-300 mb-3" />
                          <h4 className="text-lg font-black text-slate-900 line-clamp-1">
                            {queueToken.doctor?.name ? `Dr. ${queueToken.doctor.name}` : "General Physician"}
                          </h4>
                          <p className="text-[10px] font-black text-slate-400 mt-1 uppercase truncate">
                            {queueToken.doctor?.specialization || "Clinical Consultation"}
                          </p>
                        </div>
                      </div>

                      {queueToken.status === 'waiting' && (
                        <div className="bg-primary p-6 md:p-10 rounded-[2rem] text-white relative overflow-hidden group shadow-2xl shadow-primary/20">
                          <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Sparkles className="h-32 w-32" />
                          </div>
                          <div className="flex items-center gap-6 relative z-10">
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                              <Clock className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Expected Arrival</p>
                              <h4 className="text-3xl md:text-5xl font-black">~{queueToken.estimated_wait_time || 20}m</h4>
                            </div>
                          </div>
                          <p className="mt-8 text-sm font-bold text-white/80 leading-relaxed relative z-10">
                            Our system detects your position. Please stay within notification range of the clinic for the best experience.
                          </p>
                        </div>
                      )}

                      {queueToken.status === 'called' && (
                        <div className="bg-emerald-500 p-8 md:p-12 rounded-[2rem] text-white shadow-2xl shadow-emerald-200 text-center animate-bounce-subtle">
                          <CheckCircle2 className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-6" />
                          <h4 className="text-2xl md:text-4xl font-black mb-2">You are up next!</h4>
                          <p className="text-base md:text-lg font-bold opacity-90">Please head to the clinic wing immediately.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="glass-card border-none p-10 md:p-20 text-center shadow-xl">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl md:text-3xl font-black text-slate-900 mb-2">Token Unrecognized</h3>
                    <p className="text-sm md:text-lg text-slate-400 font-bold mb-8">This reference number doesn't match any active clinical records.</p>
                    <Button onClick={() => setSearched(false)} className="rounded-xl font-black bg-primary text-white h-12 md:h-14 px-8">Refresh Scanner</Button>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}