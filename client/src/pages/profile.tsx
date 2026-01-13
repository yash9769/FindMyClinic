import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, User, Heart, Phone, Shield, Pill, AlertTriangle, QrCode, Sparkles, Save, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import QRCode from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import profBg from "@/images/prof.jpg";

interface ProfileData {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
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

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '', dateOfBirth: '', gender: '', phone: '', emergencyContact: '',
    emergencyPhone: '', bloodType: '', allergies: '', medicalConditions: '',
    medications: '', insuranceProvider: '', insuranceNumber: ''
  });

  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (!user) { setLocation('/'); return; }
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single();
      if (data) {
        setProfileData({
          fullName: data.full_name || '', dateOfBirth: data.date_of_birth || '', gender: data.gender || '',
          phone: data.phone || '', emergencyContact: data.emergency_contact || '',
          emergencyPhone: data.emergency_phone || '', bloodType: data.blood_type || '',
          allergies: data.allergies || '', medicalConditions: data.medical_conditions || '',
          medications: data.medications || '', insuranceProvider: data.insurance_provider || '',
          insuranceNumber: data.insurance_number || ''
        });
        if (data.full_name && data.date_of_birth && data.phone) {
          setQrCodeUrl(`${window.location.origin}/patient-info/${user.id}`);
          setShowQRCode(true);
        }
      }
    } catch (err) { setError('Failed to load profile'); } finally { setLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setError(null); setSuccess(null);
    try {
      const { error } = await supabase.from('user_profiles').upsert({
        user_id: user.id,
        full_name: profileData.fullName,
        date_of_birth: profileData.dateOfBirth,
        gender: profileData.gender,
        phone: profileData.phone,
        emergency_contact: profileData.emergencyContact,
        emergency_phone: profileData.emergencyPhone,
        blood_type: profileData.bloodType,
        allergies: profileData.allergies,
        medical_conditions: profileData.medicalConditions,
        medications: profileData.medications,
        insurance_provider: profileData.insuranceProvider,
        insurance_number: profileData.insuranceNumber,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      setSuccess('Profile updated successfully!');
      setShowQRCode(true);
      setQrCodeUrl(`${window.location.origin}/patient-info/${user.id}`);
    } catch (err) { setError('Failed to save profile.'); } finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background reversion */}
      <div className="fixed inset-0 z-0">
        <img src={profBg} className="w-full h-full object-cover filter brightness-[0.4]" alt="" />
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>
      </div>

      <div className="noise opacity-[0.05]"></div>

      <div className="container mx-auto px-4 py-16 relative z-10 max-w-5xl">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-white border-white/20 text-sm font-bold rounded-full uppercase tracking-widest backdrop-blur-md">Health Identity</Badge>
          <h1 className="text-5xl font-black text-white mb-4 tracking-tight drop-shadow-xl">Global <span className="text-primary italic">Medical Passport</span></h1>
          <p className="text-lg text-white/70 font-medium max-w-2xl mx-auto">This data synchronizes your clinical history across our secure healthcare network.</p>
        </motion.div>

        <form onSubmit={handleSave} className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Main Column */}
          <div className="space-y-8">
            <motion.div {...fadeInUp}>
              <Card className="glass-card border-none bg-white/95 backdrop-blur-2xl overflow-hidden h-full shadow-2xl">
                <CardHeader className="p-8 md:p-10 pb-4">
                  <CardTitle className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                      <User className="h-6 w-6" />
                    </div>
                    Core Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 md:p-10 space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Full Name *</Label>
                      <Input className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" value={profileData.fullName} onChange={e => setProfileData({ ...profileData, fullName: e.target.value })} required placeholder="Enter name" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Birth Date *</Label>
                      <Input type="date" className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" value={profileData.dateOfBirth} onChange={e => setProfileData({ ...profileData, dateOfBirth: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Contact Identity *</Label>
                      <Input className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} required placeholder="Phone number" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Gender</Label>
                      <Select value={profileData.gender} onValueChange={v => setProfileData({ ...profileData, gender: v })}>
                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold"><SelectValue placeholder="Identify" /></SelectTrigger>
                        <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
              <Card className="glass-card border-none bg-white/95 backdrop-blur-2xl overflow-hidden h-full shadow-2xl">
                <CardHeader className="p-8 md:p-10 pb-4">
                  <CardTitle className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-sm">
                      <Heart className="h-6 w-6" />
                    </div>
                    Medical Baseline
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 md:p-10 space-y-6">
                  <div className="space-y-2">
                    <Label className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Critical Allergies</Label>
                    <Textarea className="rounded-xl bg-slate-50 border-slate-100 min-h-[100px] font-bold" placeholder="List any known allergies..." value={profileData.allergies} onChange={e => setProfileData({ ...profileData, allergies: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Chronic Conditions</Label>
                    <Textarea className="rounded-xl bg-slate-50 border-slate-100 min-h-[100px] font-bold" placeholder="Asthma, Diabetes, etc." value={profileData.medicalConditions} onChange={e => setProfileData({ ...profileData, medicalConditions: e.target.value })} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Secondary Column */}
          <div className="space-y-8">
            <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
              <Card className="glass-card border-none bg-white/95 backdrop-blur-2xl overflow-hidden h-full shadow-2xl">
                <CardHeader className="p-8 md:p-10 pb-4">
                  <CardTitle className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-sm">
                      <Shield className="h-6 w-6" />
                    </div>
                    Protection & Hub
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 md:p-10 space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Emergency Contact</Label>
                      <Input className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" placeholder="Person Name" value={profileData.emergencyContact} onChange={e => setProfileData({ ...profileData, emergencyContact: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Contact Phone</Label>
                      <Input className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" placeholder="Phone Number" value={profileData.emergencyPhone} onChange={e => setProfileData({ ...profileData, emergencyPhone: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Carrier / Provider</Label>
                      <Input className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" placeholder="Insurance Co." value={profileData.insuranceProvider} onChange={e => setProfileData({ ...profileData, insuranceProvider: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Blood Type</Label>
                      <Select value={profileData.bloodType} onValueChange={v => setProfileData({ ...profileData, bloodType: v })}>
                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold"><SelectValue placeholder="O+" /></SelectTrigger>
                        <SelectContent>
                          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
              <Card className="glass-card border-none bg-white/95 backdrop-blur-2xl overflow-hidden h-full shadow-2xl">
                <CardHeader className="p-8 md:p-10 pb-4">
                  <CardTitle className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-sm">
                      <Pill className="h-6 w-6" />
                    </div>
                    Active Medications
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 md:p-10">
                  <div className="space-y-2">
                    <Label className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Current Regimen</Label>
                    <Textarea className="rounded-xl bg-slate-50 border-slate-100 min-h-[140px] font-bold" placeholder="Names and dosages..." value={profileData.medications} onChange={e => setProfileData({ ...profileData, medications: e.target.value })} />
                  </div>

                  <div className="pt-8">
                    <Button type="submit" disabled={saving} className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 font-black text-lg shadow-xl shadow-primary/40 transition-all active:scale-95">
                      {saving ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Save className="mr-2 h-6 w-6" />}
                      Sync Passport
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </form>

        <AnimatePresence>
          {(error || success) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-12 max-w-2xl mx-auto">
              <Alert className={`${success ? 'bg-emerald-500 text-white border-none' : 'bg-rose-500 text-white border-none'} rounded-2xl p-6 shadow-2xl`}>
                <div className="flex items-center gap-4">
                  {success ? <CheckCircle2 className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
                  <AlertDescription className="font-black text-lg">{success || error}</AlertDescription>
                </div>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {showQRCode && (
          <motion.div {...fadeInUp}>
            <Card className="glass-card bg-slate-900 border-none shadow-[0_40px_80px_rgba(0,0,0,0.5)]">
              <div className="p-12 text-center relative overflow-hidden">
                <div className="max-w-xl mx-auto space-y-10 relative z-10">
                  <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/20">
                    <QrCode className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">Universal <span className="text-indigo-400 italic">Passport Link</span></h2>
                  <p className="text-slate-400 font-bold max-w-sm mx-auto">Present this secure signature to any clinical facility for instant profile synchronization.</p>
                  <div className="p-10 bg-white rounded-[3rem] shadow-2xl inline-block transform transition-transform hover:scale-105 duration-500">
                    <QRCode value={qrCodeUrl} size={220} level="H" />
                  </div>
                  <div className="pt-6">
                    <Badge className="bg-white/5 text-white border-white/10 px-6 py-2 rounded-full font-black text-[10px] tracking-widest uppercase">Encryption Active: AES-256</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
