import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, User, Settings, Edit, QrCode, Ticket, Shield, Activity, Sparkles, TrendingUp, ArrowRight, X, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import QRCode from 'qrcode.react';
import { motion, AnimatePresence } from "framer-motion";
import dashboardBg from "@/images/DB.jpg";

interface ClinicVisit {
  id: string;
  clinic_name: string;
  visit_date: string;
  status: string;
  location: string;
}

interface QueueToken {
  id: string;
  token_number: number;
  status: string;
  estimated_wait_time: number | null;
  created_at: string;
  clinic: {
    name: string;
    address: string;
  };
}

interface UserProfile {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodType: string;
  allergies: string;
  medicalConditions: string;
  medications: string;
  insuranceProvider: string;
  insuranceNumber: string;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function UserDashboard() {
  const { user, userRole } = useAuth();
  const [, setLocation] = useLocation();
  const [visits, setVisits] = useState<ClinicVisit[]>([]);
  const [queueTokens, setQueueTokens] = useState<QueueToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '', phone: '', dateOfBirth: '', gender: '', emergencyContact: '',
    emergencyPhone: '', bloodType: '', allergies: '', medicalConditions: '',
    medications: '', insuranceProvider: '', insuranceNumber: ''
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    if (user && userRole === 'patient') {
      fetchUserVisits();
      fetchUserProfile();
      fetchQueueTokens();
    }
  }, [user, userRole]);

  useEffect(() => {
    if (profileComplete && user?.id) {
      const patientInfoUrl = `${window.location.origin}/patient-info/${user.id}`;
      setQrCodeUrl(patientInfoUrl);
    }
  }, [profileComplete, user?.id]);

  const fetchUserVisits = async () => {
    try {
      const mockVisits: ClinicVisit[] = [
        { id: '1', clinic_name: 'City Medical Center', visit_date: '2024-01-15', status: 'completed', location: 'Downtown' },
        { id: '2', clinic_name: 'Wellness Clinic', visit_date: '2024-01-10', status: 'completed', location: 'Midtown' }
      ];
      setVisits(mockVisits);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fetchQueueTokens = async () => {
    try {
      const userTokens = JSON.parse(localStorage.getItem('userTokens') || '[]');
      const tokenIds = userTokens.map((token: any) => token.id).filter(Boolean);
      if (tokenIds.length === 0) { setQueueTokens([]); return; }

      const { data, error } = await supabase
        .from('queue_tokens')
        .select(`id, token_number, status, estimated_wait_time, created_at, clinic:clinics ( name, address )`)
        .in('id', tokenIds)
        .in('status', ['waiting', 'called'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQueueTokens((data || []).map(token => ({
        ...token,
        clinic: Array.isArray(token.clinic) ? token.clinic[0] : token.clinic,
      } as any)));
    } catch (error) { console.error(error); }
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single();
      if (data) {
        setProfile({
          fullName: data.full_name || '', phone: data.phone || '', dateOfBirth: data.date_of_birth || '',
          gender: data.gender || '', emergencyContact: data.emergency_contact || '',
          emergencyPhone: data.emergency_phone || '', bloodType: data.blood_type || '',
          allergies: data.allergies || '', medicalConditions: data.medical_conditions || '',
          medications: data.medications || '', insuranceProvider: data.insurance_provider || '',
          insuranceNumber: data.insurance_number || ''
        });
        setProfileComplete(!!(data.full_name && data.phone && data.date_of_birth));
      }
    } catch (error) { console.error(error); }
  };

  const handleCancel = async (tokenId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const { error } = await supabase.from('queue_tokens').update({ status: 'cancelled' }).eq('id', tokenId);
      if (error) throw error;
      await fetchQueueTokens();
    } catch (error) { alert('Failed to cancel.'); }
  };

  if (userRole !== 'patient') return <div className="min-h-screen flex items-center justify-center font-black">ACCESS DENIED</div>;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Reverted Background with DB.jpg */}
      <div className="fixed inset-0 z-0">
        <img src={dashboardBg} className="w-full h-full object-cover filter brightness-[0.25]" alt="" />
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]"></div>
      </div>

      <div className="noise opacity-[0.03]"></div>

      <div className="relative z-10 px-4 md:px-0">
        {/* Header Section */}
        <section className="py-8 md:py-16 bg-white/5 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <motion.div {...fadeInUp}>
                <Badge className="bg-primary/20 text-primary border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest mb-4">Secured Health Dashboard</Badge>
                <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter drop-shadow-2xl">
                  Welcome, <span className="text-primary italic">{profile.fullName.split(' ')[0] || 'Patient'}</span>
                </h1>
              </motion.div>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" className="h-14 px-8 rounded-2xl border-white/20 bg-white/5 text-white font-black hover:bg-white/10 shadow-xl transition-all" onClick={() => setLocation('/profile')}>
                  <Settings className="h-5 w-5 mr-3" /> Profile
                </Button>
                <Button className="h-14 px-8 rounded-2xl bg-primary text-white font-black hover:scale-105 shadow-2xl shadow-primary/20 transition-all" onClick={() => setLocation('/symptom-analysis')}>
                  <Sparkles className="h-5 w-5 mr-3" /> New Screening
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-12">
            {[
              { label: "Visits", val: visits.length, icon: Calendar, color: "primary" },
              { label: "Living", val: queueTokens.length, icon: Ticket, color: "emerald-500" },
              { label: "Alerts", val: profile.allergies ? "!" : "Ok", icon: Shield, color: "rose-500" },
              { label: "Saved", val: "14h", icon: TrendingUp, color: "amber-500" }
            ].map((stat, i) => (
              <motion.div key={i} {...fadeInUp} transition={{ delay: i * 0.1 }}>
                <div className="premium-card bg-white/95 backdrop-blur-2xl">
                  <div className="p-6 md:p-8 flex flex-col items-center md:items-start">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-slate-50 text-indigo-600">
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div className="text-2xl md:text-4xl font-black text-slate-900 mb-1">{stat.val}</div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
            <div className="lg:col-span-2 space-y-8 md:space-y-12">
              {/* Active Tokens */}
              <motion.div {...fadeInUp}>
                <Card className="glass-card bg-white/90">
                  <CardHeader className="p-8 md:p-12 pb-4">
                    <CardTitle className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-4">
                      <Ticket className="h-8 w-8 text-indigo-500" /> Live Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 md:p-12 space-y-6">
                    {queueTokens.length === 0 ? (
                      <div className="text-center py-16 px-8 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                        <Ticket className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                        <h3 className="text-xl font-black text-slate-900 mb-2">No active sessions</h3>
                        <p className="text-sm font-bold text-slate-400 mb-8 max-w-xs mx-auto">Explore clinical availability and secure your position digitally.</p>
                        <Button className="h-14 px-10 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800" onClick={() => setLocation('/patients')}>Explore Clinics</Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {queueTokens.map((token) => (
                          <div key={token.id} className="p-6 md:p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                              <div className="flex items-center gap-6">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-900 text-white rounded-3xl flex flex-col items-center justify-center shadow-xl group-hover:bg-indigo-600 transition-colors duration-500">
                                  <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">Token</span>
                                  <span className="text-2xl md:text-3xl font-black tracking-tighter">#{token.token_number}</span>
                                </div>
                                <div>
                                  <h4 className="text-lg md:text-xl font-black text-slate-900 mb-1 uppercase tracking-tight">{token.clinic.name}</h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {token.clinic.address}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-10">
                                <div className="text-right">
                                  <h4 className="text-3xl md:text-5xl font-black text-indigo-600 tracking-tighter">~{token.estimated_wait_time || 15}m</h4>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Incoming</p>
                                </div>
                                <Button variant="ghost" className="h-12 w-12 rounded-2xl text-rose-500 hover:bg-rose-50" onClick={() => handleCancel(token.id)}>
                                  <X className="h-6 w-6" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* History Preview */}
              <motion.div {...fadeInUp}>
                <Card className="glass-card border-none bg-white/95 backdrop-blur-2xl shadow-2xl rounded-[2.5rem] overflow-hidden">
                  <CardHeader className="p-8 md:p-12 pb-4">
                    <CardTitle className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-4">
                      <Activity className="h-8 w-8 text-secondary" /> Clinical Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 md:p-12">
                    <div className="grid md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Patient Baseline</h4>
                          {[{ l: "Full Name", v: profile.fullName }, { l: "Blood", v: profile.bloodType }, { l: "Allergies", v: profile.allergies || "None" }].map(it => (
                            <div key={it.l} className="flex justify-between items-center py-4 border-b border-slate-200/50 last:border-0">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{it.l}</span>
                              <span className="text-xs font-black text-slate-900">{it.v || "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-8">
                        <div>
                          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Chronic Overview</h4>
                          <p className="text-sm font-bold text-slate-600 leading-relaxed">{profile.medicalConditions || "No chronic conditions recorded."}</p>
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Daily Regimen</h4>
                          <p className="text-sm font-bold text-slate-600 leading-relaxed">{profile.medications || "No active medications."}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="space-y-8 md:space-y-12">
              {/* QR Sidebar */}
              <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
                <Card className="glass-card border-none bg-slate-900 text-white rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.5)]">
                  <CardHeader className="p-10 text-center">
                    <CardTitle className="text-2xl font-black flex items-center justify-center gap-3">
                      <QrCode className="h-8 w-8 text-primary" /> Health Link
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-10 pt-0 text-center">
                    {profileComplete ? (
                      <div className="space-y-10">
                        <div className="p-8 bg-white rounded-[3rem] shadow-inner inline-block transform scale-110">
                          <QRCode value={qrCodeUrl} size={180} level="H" />
                        </div>
                        <p className="text-slate-400 font-bold text-sm">Valid identity token for digital check-ins at any FindMyClinic facility.</p>
                        <Badge className="bg-primary text-white border-none px-6 py-2 rounded-full font-black text-[10px] tracking-widest">ENCRYPTED CORE</Badge>
                      </div>
                    ) : (
                      <div className="py-10 px-6 border-2 border-dashed border-white/10 rounded-[2rem]">
                        <AlertTriangle className="h-12 w-12 text-slate-700 mx-auto mb-6" />
                        <p className="font-bold text-slate-400 text-sm mb-8">Access limited. Verify your baseline identity to unlock QR clinical sync.</p>
                        <Button className="w-full h-14 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-100" onClick={() => setLocation('/profile')}>Verify Now</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* History Preview List */}
              <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
                <Card className="glass-card border-none bg-white/95 backdrop-blur-2xl shadow-xl rounded-[2.5rem]">
                  <CardHeader className="p-8 md:p-10 pb-4">
                    <CardTitle className="text-xl font-black text-slate-900">Past Sessions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 md:p-10 space-y-4">
                    {visits.map(v => (
                      <div key={v.id} className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white transition-all">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <MapPin className="h-6 w-6 text-slate-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-black text-slate-900 truncate">{v.clinic_name}</h5>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{v.visit_date}</p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[9px] uppercase">{v.status}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
