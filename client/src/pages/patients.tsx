import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Search, MapPin, Clock, Users, Navigation, User, Star, IndianRupee, Activity, CheckCircle2, AlertCircle, Sparkles, X, ChevronRight, Phone, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import type { Clinic } from "@shared/schema";
import { useDebounce } from "@/hooks/use-debounce";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import locoBg from "@/images/loco.jpg";

const getStatusColor = (status: string) => {
  switch (status) {
    case "open": return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
    case "busy": return "bg-amber-500/10 text-amber-600 border-amber-200 font-bold";
    case "closed": return "bg-rose-500/10 text-rose-600 border-rose-200 grayscale";
    default: return "bg-slate-500/10 text-slate-600 border-slate-200";
  }
};

const getAreaFromAddress = (address: string) => {
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    return `${parts[parts.length - 3]}, ${parts[parts.length - 2]}`;
  }
  return parts.slice(0, 2).join(', ');
};

interface ClinicWithDistance extends Clinic {
  distance?: number;
  currentWaitTime: number | null;
  queueSize: number | null;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience_years: number;
  rating: number;
  is_available_today: boolean;
  consultation_fee: number;
  bio: string;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function Patients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedClinicForDoctors, setSelectedClinicForDoctors] = useState<ClinicWithDistance | null>(null);
  const [isDoctorsDialogOpen, setIsDoctorsDialogOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [userQueueStatus, setUserQueueStatus] = useState<{
    position: number;
    clinicName: string;
    estimatedWaitTime: number;
    clinicId: string;
  } | null>(null);

  // Load active tracker from localStorage on mount
  useEffect(() => {
    const tokens = JSON.parse(localStorage.getItem('userTokens') || '[]');
    if (tokens.length > 0) {
      const latest = tokens[tokens.length - 1]; // Simply track latest for demo
      setUserQueueStatus({
        position: Math.floor(Math.random() * 5) + 1, // Simulated current position
        clinicName: "Active Session",
        estimatedWaitTime: 15,
        clinicId: latest.clinicId
      });
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("GPS not supported");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      (error) => {
        setLocationError("GPS skipped");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const { data: clinicDoctors = [] } = useQuery({
    queryKey: ["clinic-doctors", selectedClinicForDoctors?.id],
    queryFn: async () => {
      if (!selectedClinicForDoctors?.id) return [];
      const { data, error } = await supabase.from('doctors').select('*').eq('clinic_id', selectedClinicForDoctors.id).order('rating', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClinicForDoctors?.id && isDoctorsDialogOpen,
  });

  const { data: clinics = [], isLoading } = useQuery({
    queryKey: ["clinics", debouncedSearchQuery, userLocation],
    queryFn: async () => {
      let q = supabase.from('clinics').select('*').eq('is_active', true);
      if (debouncedSearchQuery) q = q.or(`name.ilike.%${debouncedSearchQuery}%,address.ilike.%${debouncedSearchQuery}%`);
      const { data, error } = await q;
      if (error) throw error;

      return data.map(c => ({
        ...c,
        distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, parseFloat(c.latitude), parseFloat(c.longitude)) : undefined,
        currentWaitTime: c.currentWaitTime || Math.floor(Math.random() * 45) + 5,
        queueSize: c.queueSize || Math.floor(Math.random() * 15) + 1
      })).sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    },
  });

  const handleJoinQueue = async (clinic: ClinicWithDistance, doctor?: Doctor) => {
    if (isJoining) return;
    setIsJoining(true);

    try {
      let patientId;
      const patientPhone = user?.phone || user?.user_metadata?.phone || '0000000000';
      const patientName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Anonymous Patient';

      // 1. Check/Create Patient
      const { data: existingPatient } = await supabase.from('patients').select('id').eq('phone', patientPhone).maybeSingle();

      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        const { data: newPatient, error: pErr } = await supabase.from('patients').insert([{ name: patientName, phone: patientPhone }]).select('id').single();
        if (pErr) {
          console.error("Patient Insert Error:", pErr);
          throw new Error("Unable to register patient record. Please check Supabase RLS.");
        }
        patientId = newPatient.id;
      }

      // 2. Insert Token
      const { data: token, error: tErr } = await supabase.from('queue_tokens').insert([{
        clinic_id: clinic.id,
        patient_id: patientId,
        doctor_id: doctor?.id || null,
        token_number: Math.floor(Math.random() * 9000) + 1000,
        status: 'waiting',
        estimated_wait_time: Math.max(5, clinic.currentWaitTime ? Math.floor(clinic.currentWaitTime / 1.5) : 15)
      }]).select('id, token_number, created_at, estimated_wait_time').single();

      if (tErr) {
        console.error("Token Insert Error:", tErr);
        throw new Error("Unable to generate queue token. Please check Supabase RLS.");
      }

      // 3. Local Storage Sync
      const userTokens = JSON.parse(localStorage.getItem('userTokens') || '[]');
      userTokens.push({ id: token.id, tokenNumber: token.token_number, clinicId: clinic.id, doctorId: doctor?.id, createdAt: token.created_at });
      localStorage.setItem('userTokens', JSON.stringify(userTokens));

      setUserQueueStatus({
        position: (clinic.queueSize || 0) + 1,
        clinicName: doctor ? `${clinic.name} - Dr. ${doctor.name}` : clinic.name,
        estimatedWaitTime: token.estimated_wait_time,
        clinicId: clinic.id
      });

      toast({
        title: "Registration Success!",
        description: `Your token #${token.token_number} is now active.`,
        className: "bg-emerald-500 text-white font-black rounded-2xl border-none shadow-2xl",
      });

      setIsDoctorsDialogOpen(false);
    } catch (e: any) {
      toast({
        title: "Connection Failed",
        description: e.message || "Network error. Please ensure you have clinical permissions.",
        variant: "destructive",
        className: "rounded-2xl font-bold",
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-24">
      {/* Reverted Background with Image */}
      <div className="fixed inset-0 z-0">
        <img src={locoBg} className="w-full h-full object-cover filter brightness-[0.25] contrast-[1.1]" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/20 to-slate-900/80 backdrop-blur-[2px]"></div>
      </div>

      <div className="noise opacity-[0.03]"></div>

      <div className="container mx-auto px-4 py-8 md:py-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div {...fadeInUp} className="text-center mb-10 md:mb-20">
            <h1 className="text-5xl md:text-8xl font-black text-white mb-4 tracking-tighter drop-shadow-2xl">
              Clinics <span className="text-primary italic">Nearby</span>
            </h1>
            <Badge className="bg-indigo-600 text-white border-none px-6 py-2 rounded-full font-black text-xs uppercase tracking-[0.2em] mb-4 shadow-xl shadow-indigo-500/20">
              Live clinic status
            </Badge>
          </motion.div>

          {/* User Active Status */}
          <AnimatePresence>
            {userQueueStatus && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                className="fixed bottom-6 left-4 right-4 z-[100] md:relative md:bottom-auto md:mb-12"
              >
                <Card className="glass-card border-none bg-indigo-600 text-white p-4 overflow-hidden relative shadow-[0_30px_60px_-15px_rgba(79,70,229,0.4)] md:max-w-md md:mx-auto">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-xl flex flex-col items-center justify-center shadow-lg flex-shrink-0 border border-white/20">
                      <span className="text-[8px] font-black opacity-60 uppercase">Pos</span>
                      <span className="text-lg font-black">#{userQueueStatus.position}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                        <h3 className="text-sm font-black uppercase tracking-wider">Tracking Active</h3>
                      </div>
                      <p className="font-bold text-white/80 text-xs truncate">{userQueueStatus.clinicName}</p>
                    </div>
                    <Link href="/queue-status">
                      <Button variant="outline" className="h-10 bg-white/10 border-white/20 hover:bg-white/20 text-white font-black text-xs rounded-xl">
                        View Live Queue
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white" onClick={() => setUserQueueStatus(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Section */}
          <div className="max-w-3xl mx-auto mb-16 px-2">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-[2rem] blur-3xl group-focus-within:bg-primary/40 transition-all"></div>
              <div className="relative flex items-center bg-white/95 backdrop-blur-2xl rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl p-1.5 md:p-2 border border-white/50">
                <Search className="ml-6 text-slate-400 h-6 w-6" />
                <Input
                  type="text"
                  placeholder="Search clinic, doctor, or area (e.g. Powai, ENT)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 md:h-20 border-none bg-transparent text-lg md:text-xl font-black focus:ring-0 placeholder:text-slate-400"
                />
                <Button className="h-12 md:h-16 px-8 md:px-12 rounded-[1.2rem] md:rounded-[2rem] bg-indigo-600 text-white font-black text-lg ml-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-500/20">Find</Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mr-2">Quick Filters:</span>
              {["Open Now", "< 30 Min Wait", "Emergency", "Specialist"].map(f => (
                <Badge key={f} className="bg-white/5 hover:bg-white/10 text-white/60 border-white/10 cursor-pointer transition-colors px-3 py-1 font-bold text-[10px] uppercase">
                  {f}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 mt-10">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/10 flex items-center gap-3">
                <span className="text-[10px] font-black text-white/60 uppercase">Sort by:</span>
                <select className="bg-transparent text-white font-black text-[10px] uppercase border-none focus:ring-0 outline-none cursor-pointer">
                  <option className="bg-slate-900">Nearest First</option>
                  <option className="bg-slate-900">Shortest Wait</option>
                  <option className="bg-slate-900">Highly Rated</option>
                </select>
              </div>
              {locationLoading ? (
                <div className="flex items-center gap-2 text-white/60">
                  <Activity className="h-3 w-3 animate-spin" />
                  <span className="text-[10px] font-black uppercase">GPS Pinging...</span>
                </div>
              ) : userLocation ? (
                <p className="text-[10px] font-black text-emerald-400 uppercase flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Using precise location (Mumbai)
                </p>
              ) : (
                <Button variant="ghost" onClick={requestLocation} className="text-white/40 hover:text-white font-black text-[10px] uppercase tracking-widest p-0 h-auto flex items-center gap-2">
                  <MapPin className="h-3 w-3" /> Enable GPS Discovery
                </Button>
              )}
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="glass-card h-[400px] animate-pulse rounded-[2.5rem] opacity-50" />
              ))
            ) : clinics.length === 0 ? (
              <div className="col-span-full text-center py-24 px-10">
                <div className="w-24 h-24 bg-white/5 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-2xl">
                  <MapPin className="h-10 w-10 text-white/20" />
                </div>
                <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">No Clinics Found</h3>
                <p className="text-white/40 font-bold max-w-sm mx-auto">Try broadening your search area or checking different specialties.</p>
              </div>
            ) : (
              clinics.map((clinic) => (
                <motion.div key={clinic.id} {...fadeInUp} layout>
                  <Card
                    className="glass-card border-none h-full"
                    onClick={() => { setSelectedClinicForDoctors(clinic); setIsDoctorsDialogOpen(true); }}
                  >
                    <div className="p-8 h-full flex flex-col">
                      <div className="flex justify-between items-start mb-8">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                          <Hospital className="h-7 w-7" />
                        </div>
                        <div className="text-right">
                          <Badge className={`font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border ${getStatusColor(clinic.status)}`}>
                            {clinic.status}
                          </Badge>
                          {clinic.distance !== undefined && (
                            <p className="text-[10px] font-black text-slate-400 mt-2 flex items-center justify-end gap-1">
                              <Navigation className="h-3 w-3" /> {clinic.distance < 1 ? `${Math.round(clinic.distance * 1000)}m Dist.` : `${clinic.distance.toFixed(1)}km Dist.`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{clinic.name}</h3>
                        <p className="text-[10px] font-black text-slate-400 flex items-center truncate mb-8 uppercase tracking-widest">
                          <MapPin className="h-4 w-4 mr-2 text-indigo-400" /> {getAreaFromAddress(clinic.address)}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="clinical-card p-4 flex flex-col relative group/hint">
                            <span className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Est. Wait</span>
                            <span className="text-xl font-black text-indigo-600 flex items-center gap-2"><Clock className="h-4 w-4" /> {clinic.currentWaitTime}m</span>
                            {/* Wait Time Hint */}
                            <div className="absolute -top-10 left-0 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded-md opacity-0 group-hover/hint:opacity-100 transition-opacity pointer-events-none whitespace-nowrap uppercase tracking-tighter">
                              For new arrivals
                            </div>
                          </div>
                          <div className="clinical-card p-4 flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Active Queue</span>
                            <span className="text-xl font-black text-emerald-600 flex items-center gap-2"><Users className="h-4 w-4" /> {clinic.queueSize}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          className="flex-1 h-14 rounded-2xl bg-slate-900 text-white font-black hover:bg-indigo-600 shadow-xl active:scale-95 transition-all text-sm uppercase tracking-wider"
                          disabled={isJoining || clinic.status === "closed"}
                          onClick={(e) => { e.stopPropagation(); handleJoinQueue(clinic); }}
                        >
                          {isJoining ? <Activity className="h-5 w-5 animate-spin" /> : "Join Queue Now"}
                        </Button>
                        <Button variant="ghost" className="h-14 w-14 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center p-0 active:scale-95 hover:bg-indigo-50 hover:border-indigo-100 transition-all">
                          <ArrowRight className="h-6 w-6 text-slate-300 group-hover:text-indigo-500" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Specialist Selection - Bottom Sheet on Mobile, Dialog on Desktop */}
      <Dialog open={isDoctorsDialogOpen} onOpenChange={setIsDoctorsDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-3xl border-none p-0 overflow-hidden h-[85vh] md:h-auto md:max-h-[85vh] flex flex-col bottom-0 md:bottom-auto md:top-1/2 translate-y-0 md:-translate-y-1/2 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] z-[200]">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-4 md:hidden"></div>

          <div className="px-8 md:px-12 py-8 border-b border-slate-100 sticky top-0 bg-white/50 backdrop-blur-md z-10">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-none mb-2">Specialists</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedClinicForDoctors?.name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsDoctorsDialogOpen(false)} className="rounded-2xl text-slate-400 hover:text-slate-900">
                <X className="h-7 w-7" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-6">
            {clinicDoctors.length === 0 ? (
              <div className="text-center py-24 opacity-20">
                <Users className="h-16 w-16 mx-auto mb-6" />
                <p className="font-black text-sm uppercase">Empty Roster</p>
              </div>
            ) : (
              clinicDoctors.map((doc: Doctor) => (
                <div key={doc.id} className="premium-card p-6 md:p-10 group bg-white/80 backdrop-blur-md">
                  <div className="flex flex-col gap-8">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-2xl font-black text-slate-900 leading-none mb-2">{doc.name}</h4>
                          <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-black text-[10px] uppercase tracking-widest py-1 px-3">
                            {doc.specialization}
                          </Badge>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <User className="h-8 w-8" />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center text-xs font-black text-slate-600 gap-2">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {doc.rating} Rating
                        </div>
                        <div className="flex items-center text-xs font-black text-slate-600 gap-2">
                          <Sparkles className="h-4 w-4 text-indigo-500" /> {doc.experience_years}Y Exp.
                        </div>
                        <div className="flex items-center text-xs font-black text-emerald-600 gap-1.5">
                          <IndianRupee className="h-4 w-4" /> {doc.consultation_fee} Fee
                        </div>
                      </div>
                    </div>
                    <Button
                      className="w-full h-16 rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-xl shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 transition-all uppercase tracking-wider"
                      disabled={isJoining}
                      onClick={() => handleJoinQueue(selectedClinicForDoctors!, doc)}
                    >
                      {isJoining ? <Activity className="h-6 w-6 animate-spin" /> : "Secure Specific Token"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-8 md:p-12 pt-4 bg-slate-50/30 hidden md:block">
            <Button variant="ghost" onClick={() => setIsDoctorsDialogOpen(false)} className="w-full h-14 rounded-2xl font-black text-slate-400 hover:text-slate-900 uppercase text-xs tracking-[0.2em]">
              Exit Portal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Hospital(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 6v4" />
      <path d="M14 14h-4" />
      <path d="M14 18h-4" />
      <path d="M14 8h-4" />
      <path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2" />
      <path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18" />
    </svg>
  );
}
