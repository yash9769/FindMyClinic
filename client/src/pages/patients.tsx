import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Clock, Users, Navigation, User, Star, IndianRupee, Activity, CheckCircle2, AlertCircle, Sparkles, X, ChevronRight, Phone, Heart } from "lucide-react";
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
    case "busy": return "bg-amber-500/10 text-amber-600 border-amber-200";
    case "closed": return "bg-rose-500/10 text-rose-600 border-rose-200";
    default: return "bg-slate-500/10 text-slate-600 border-slate-200";
  }
};

interface ClinicWithDistance extends Clinic {
  distance?: number;
  currentWaitTime?: number;
  queueSize?: number;
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
  } | null>(null);

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
        estimatedWaitTime: token.estimated_wait_time
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
        <img src={locoBg} className="w-full h-full object-cover filter brightness-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-900/60 backdrop-blur-[1px]"></div>
      </div>

      <div className="noise opacity-[0.03]"></div>

      <div className="container mx-auto px-4 py-8 md:py-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div {...fadeInUp} className="text-center mb-10 md:mb-20">
            <h1 className="text-5xl md:text-8xl font-black text-white mb-4 tracking-tighter drop-shadow-2xl">
              Clinics <span className="text-primary italic">Nearby</span>
            </h1>
            <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20 px-6 py-2 rounded-full font-black text-xs uppercase tracking-[0.2em] mb-4">
              Real-Time Inventory Access
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
                <Card className="glass-card border-none bg-primary text-white p-6 overflow-hidden relative shadow-[0_30px_60px_-15px_rgba(37,99,235,0.4)]">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white text-primary rounded-2xl flex flex-col items-center justify-center shadow-xl flex-shrink-0">
                      <span className="text-[10px] font-black opacity-60 uppercase">Pos</span>
                      <span className="text-2xl font-black">#{userQueueStatus.position}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-black truncate">Live Track</h3>
                      <p className="font-bold text-white/80 text-sm truncate">{userQueueStatus.clinicName}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10" onClick={() => setUserQueueStatus(null)}>
                      <X className="h-6 w-6" />
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
              <div className="relative flex items-center bg-white/90 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl p-1.5 md:p-2 border border-white/50">
                <Search className="ml-6 text-slate-400 h-6 w-6" />
                <Input
                  type="text"
                  placeholder="Find by clinic, area, or doctor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 md:h-20 border-none bg-transparent text-lg md:text-xl font-black focus:ring-0 placeholder:text-slate-400"
                />
                <Button className="h-12 md:h-16 px-8 md:px-12 rounded-[1.2rem] md:rounded-[2rem] bg-slate-900 text-white font-black text-lg ml-2 hover:scale-[1.02] active:scale-95 transition-all">Go</Button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {locationLoading ? (
                <Badge className="bg-white/10 text-white border-white/20 px-4 py-2 font-black text-[10px] uppercase">GPS Ping...</Badge>
              ) : userLocation ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-none px-4 py-2 font-black text-[10px] uppercase flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div> Nearest First
                </Badge>
              ) : (
                <Button variant="ghost" onClick={requestLocation} className="text-white/40 hover:text-white font-black text-[10px] uppercase tracking-widest p-0 h-auto">
                  Enable Location Discovery
                </Button>
              )}
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i} className="bg-white/5 border-none h-[300px] animate-pulse rounded-[2.5rem]" />
              ))
            ) : clinics.length === 0 ? (
              <div className="col-span-full text-center py-20 px-10">
                <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-white/10">
                  <MapPin className="h-10 w-10 text-white/20" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Inventory Empty</h3>
                <p className="text-white/40 font-bold">Adjust your coordinates or search term.</p>
              </div>
            ) : (
              clinics.map((clinic) => (
                <motion.div key={clinic.id} {...fadeInUp} layout>
                  <Card
                    className="glass-card border-none overflow-hidden bg-white/95 backdrop-blur-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] rounded-[2rem] group cursor-pointer active:scale-95 transition-all"
                    onClick={() => { setSelectedClinicForDoctors(clinic); setIsDoctorsDialogOpen(true); }}
                  >
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-8">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                          <Hospital className="h-7 w-7" />
                        </div>
                        <div className="text-right">
                          <Badge className={`font-black text-[10px] uppercase tracking-widest ${getStatusColor(clinic.status)}`}>
                            {clinic.status}
                          </Badge>
                          {clinic.distance !== undefined && (
                            <p className="text-[10px] font-black text-slate-400 mt-2">
                              {clinic.distance < 1 ? `${Math.round(clinic.distance * 1000)}m Dist.` : `${clinic.distance.toFixed(1)}km Dist.`}
                            </p>
                          )}
                        </div>
                      </div>

                      <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight group-hover:text-primary transition-colors">{clinic.name}</h3>
                      <p className="text-xs font-bold text-slate-400 flex items-center truncate mb-8">
                        <MapPin className="h-4 w-4 mr-2" /> {clinic.address}
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-slate-50 flex flex-col rounded-2xl border border-slate-100">
                          <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Wait</span>
                          <span className="text-xl font-black text-primary flex items-center gap-2"><Clock className="h-4 w-4" /> {clinic.currentWaitTime}m</span>
                        </div>
                        <div className="p-4 bg-slate-50 flex flex-col rounded-2xl border border-slate-100">
                          <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Queue</span>
                          <span className="text-xl font-black text-secondary flex items-center gap-2"><Users className="h-4 w-4" /> {clinic.queueSize}</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          className="flex-1 h-14 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 shadow-xl active:scale-95 transition-all"
                          disabled={isJoining || clinic.status === "closed"}
                          onClick={(e) => { e.stopPropagation(); handleJoinQueue(clinic); }}
                        >
                          {isJoining ? <Activity className="h-5 w-5 animate-spin" /> : "Join Queue"}
                        </Button>
                        <Button variant="ghost" className="h-14 w-14 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center p-0 active:scale-95">
                          <ChevronRight className="h-6 w-6 text-slate-300" />
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
                <Card key={doc.id} className="p-6 md:p-10 bg-slate-50/50 border-slate-100/50 rounded-[2rem] hover:bg-white hover:shadow-2xl transition-all group">
                  <div className="flex flex-col gap-8">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-2xl font-black text-slate-900 leading-none">{doc.name}</h4>
                        <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-tight py-1">{doc.specialization}</Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                        <div className="flex items-center text-xs font-black text-slate-600 gap-2">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {doc.rating}
                        </div>
                        <div className="flex items-center text-xs font-black text-slate-600 gap-2">
                          <Sparkles className="h-4 w-4 text-primary" /> {doc.experience_years}Y Exp.
                        </div>
                        <div className="flex items-center text-xs font-black text-emerald-600 gap-1.5">
                          <IndianRupee className="h-4 w-4" /> {doc.consultation_fee}
                        </div>
                      </div>
                    </div>
                    <Button
                      className="w-full h-16 rounded-[1.5rem] bg-slate-900 text-white font-black text-lg shadow-xl active:scale-95 transition-all"
                      disabled={isJoining}
                      onClick={() => handleJoinQueue(selectedClinicForDoctors!, doc)}
                    >
                      {isJoining ? <Activity className="h-6 w-6 animate-spin" /> : "Secure Specific Token"}
                    </Button>
                  </div>
                </Card>
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
