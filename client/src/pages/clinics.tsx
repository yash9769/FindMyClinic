import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Hospital, Users, TrendingUp, MessageSquare, Play, CheckCircle, Calendar, Clock, Sparkles, Shield, Rocket, ArrowRight, X, Phone, User, Star, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContactRequestSchema } from "@shared/schema";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import clinicBg from "@/images/CL.jpg";

const clinicContactSchema = insertContactRequestSchema.extend({
  type: z.literal("clinic_demo"),
  clinicName: z.string().min(1, "Clinic name is required"),
});

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

export default function Clinics() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const urlParams = new URLSearchParams(window.location.search);
  const doctorId = urlParams.get('doctor');
  const shouldBook = urlParams.get('book') === 'true';

  const { data: bookingDoctor } = useQuery({
    queryKey: ["booking-doctor", doctorId],
    queryFn: async () => {
      if (!doctorId) return null;
      const { data, error } = await supabase.from('doctors').select('*').eq('id', doctorId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!doctorId,
  });

  const { data: bookingClinic } = useQuery({
    queryKey: ["booking-clinic", bookingDoctor?.clinic_id],
    queryFn: async () => {
      if (!bookingDoctor?.clinic_id) return null;
      const { data, error } = await supabase.from('clinics').select('*').eq('id', bookingDoctor.clinic_id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!bookingDoctor,
  });

  useEffect(() => {
    if (shouldBook && bookingDoctor && bookingClinic) {
      setIsBookingDialogOpen(true);
    }
  }, [shouldBook, bookingDoctor, bookingClinic]);

  const form = useForm<z.infer<typeof clinicContactSchema>>({
    resolver: zodResolver(clinicContactSchema),
    defaultValues: {
      type: "clinic_demo",
      name: "",
      email: "",
      phone: "",
      message: "",
      clinicName: "",
    },
  });

  const submitRequestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof clinicContactSchema>) => {
      const { data: result, error } = await supabase.from('contact_requests').insert([data]).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Demo Requested!",
        description: "Our staff will reach out to schedule your personalized session.",
        className: "bg-primary text-white font-black",
      });
    },
  });

  const handleBookAppointment = async (doctorId: string, clinicId: string) => {
    try {
      const { data: patient, error: pErr } = await supabase.from('patients').insert([{ name: 'Anonymous Patient', phone: '0000000000' }]).select('id').single();
      if (pErr) throw pErr;

      const { data: token, error: tErr } = await supabase.from('queue_tokens').insert([{
        clinic_id: clinicId,
        patient_id: patient.id,
        doctor_id: doctorId,
        token_number: Math.floor(Math.random() * 9000) + 1000,
        status: 'waiting',
        estimated_wait_time: 30,
      }]).select('token_number, created_at').single();
      if (tErr) throw tErr;

      const userTokens = JSON.parse(localStorage.getItem('userTokens') || '[]');
      userTokens.push({ tokenNumber: token.token_number, clinicId, doctorId, createdAt: token.created_at });
      localStorage.setItem('userTokens', JSON.stringify(userTokens));

      toast({ title: "Appointment Confirmed", description: `Token #${token.token_number} generated.`, className: "bg-emerald-500 text-white font-black" });
      setIsBookingDialogOpen(false);
      navigate('/patients', { replace: true });
    } catch (e) {
      toast({ title: "Booking Failed", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Reverted Background with CL.jpg */}
      <div className="fixed inset-0 z-0">
        <img src={clinicBg} className="w-full h-full object-cover filter brightness-[0.3]" alt="" />
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>
      </div>

      <div className="noise opacity-[0.05]"></div>

      <div className="relative z-10 px-4 md:px-0">
        {/* Hero Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto">
            <div className="max-w-5xl mx-auto text-center mb-24">
              <motion.div {...fadeInUp}>
                <Badge className="mb-8 px-6 py-2 bg-white/10 backdrop-blur-md text-white border-white/20 text-xs font-black rounded-full tracking-[0.2em]">
                  HEALTHCARE INFRASTRUCTURE
                </Badge>
                <h1 className="text-5xl md:text-8xl font-black text-white mb-8 leading-none tracking-tighter drop-shadow-2xl">
                  Scale Your <span className="text-primary italic">Practice</span>
                </h1>
                <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto font-medium mb-12">
                  Enterprise-grade patient flow management. Eliminate waiting room friction and maximize clinic efficiency.
                </p>

                <div className="flex flex-wrap justify-center gap-6">
                  <Button size="lg" className="h-16 md:h-20 px-10 md:px-14 rounded-2xl bg-primary text-white font-black text-xl shadow-2xl shadow-primary/40 hover:scale-105 transition-all" onClick={() => setIsDialogOpen(true)}>
                    Request Integration
                  </Button>
                  <Button variant="outline" className="h-16 md:h-20 px-10 md:px-14 rounded-2xl border-white/20 bg-white/5 text-white font-black text-xl hover:bg-white/10 transition-all">
                    View Blueprint
                  </Button>
                </div>
              </motion.div>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
              <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
                <div className="absolute -inset-10 bg-primary/20 blur-[100px] rounded-full"></div>
                <img src="https://images.unsplash.com/photo-1551190822-a9333d879b1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" className="relative rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/20" alt="" />
              </motion.div>

              <div className="space-y-8">
                {[
                  { icon: TrendingUp, title: "Intelligent Queue Metrics", desc: "Real-time bottle-neck detection using proprietary throughput algorithms.", color: "primary" },
                  { icon: MessageSquare, title: "Multi-Channel Alerts", desc: "Patient notifications via WhatsApp, SMS, and Push without extra hardware.", color: "secondary" },
                  { icon: Shield, title: "Military-Grade Security", desc: "End-to-end encrypted medical record exchange protecting patient privacy.", color: "emerald-400" }
                ].map((item, i) => (
                  <Card key={i} className="glass-card border-none bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-xl group hover:scale-[1.02] transition-all">
                    <CardContent className="p-8 flex gap-6">
                      <div className={`w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors`}>
                        <item.icon className="h-7 w-7" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-900 mb-2">{item.title}</h4>
                        <p className="text-sm font-bold text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Integration Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-3xl border-none p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
            <div className="p-10 md:p-12">
              <DialogHeader className="mb-8">
                <DialogTitle className="text-3xl font-black text-slate-900">Partner with Us</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => submitRequestMutation.mutate(d))} className="space-y-6">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel className="font-black text-xs uppercase text-slate-400">Your Name</FormLabel><FormControl><Input className="h-14 rounded-xl bg-slate-50 border-slate-100 font-bold" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="clinicName" render={({ field }) => (
                    <FormItem><FormLabel className="font-black text-xs uppercase text-slate-400">Clinic / Hospital</FormLabel><FormControl><Input className="h-14 rounded-xl bg-slate-50 border-slate-100 font-bold" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel className="font-black text-xs uppercase text-slate-400">Business Email</FormLabel><FormControl><Input className="h-14 rounded-xl bg-slate-50 border-slate-100 font-bold" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full h-16 rounded-2xl bg-primary text-white font-black text-lg mt-4 shadow-xl shadow-primary/20" disabled={submitRequestMutation.isPending}>
                    {submitRequestMutation.isPending ? <Activity className="h-6 w-6 animate-spin" /> : "Initiate Onboarding"}
                  </Button>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>

        {/* Remote Booking UI */}
        <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
          <DialogContent className="sm:max-w-xl bg-white/95 backdrop-blur-3xl border-none p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
            <div className="p-10 md:p-12">
              <DialogHeader className="mb-10">
                <DialogTitle className="text-3xl font-black text-slate-900 flex items-center gap-4">
                  <Calendar className="h-8 w-8 text-emerald-500" /> Confirm Token
                </DialogTitle>
              </DialogHeader>

              {bookingDoctor && bookingClinic && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-2">Specialist</span>
                      <h5 className="font-black text-slate-900">{bookingDoctor.name}</h5>
                      <p className="text-xs font-bold text-slate-500">{bookingDoctor.specialization}</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-2">Clinical Site</span>
                      <h5 className="font-black text-slate-900">{bookingClinic.name}</h5>
                    </div>
                  </div>

                  <div className="p-8 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-4">
                      <Clock className="h-6 w-6" />
                      <span className="font-black text-lg">Live Wait Estimate</span>
                    </div>
                    <span className="text-4xl font-black italic">~{bookingClinic.currentWaitTime || 30}m</span>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button variant="ghost" className="flex-1 h-16 rounded-2xl font-black text-slate-400 hover:text-slate-900" onClick={() => setIsBookingDialogOpen(false)}>
                      Decline
                    </Button>
                    <Button className="flex-[2] h-16 rounded-2xl bg-slate-900 text-white font-black text-xl shadow-2xl active:scale-95 transition-all" onClick={() => handleBookAppointment(bookingDoctor.id, bookingClinic.id)}>
                      Authorize Booking
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function HospitalIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6v4" /><path d="M14 14h-4" /><path d="M14 18h-4" /><path d="M14 8h-4" />
      <path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2" />
      <path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18" />
    </svg>
  );
}

const Activity = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
