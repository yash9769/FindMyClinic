import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, Heart, Phone, Shield, Activity, Calendar, Droplets } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

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

export default function PatientInfo() {
  const [, params] = useRoute("/patient-info/:id");
  const userId = params?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (userId) loadPatientInfo(userId);
  }, [userId]);

  const loadPatientInfo = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('user_profiles').select('*').eq('user_id', id).single();
      if (error) throw error;
      if (data) {
        setProfileData({
          fullName: data.full_name || '', dateOfBirth: data.date_of_birth || '', gender: data.gender || '',
          phone: data.phone || '', emergencyContact: data.emergency_contact || '',
          emergencyPhone: data.emergency_phone || '', bloodType: data.blood_type || '',
          allergies: data.allergies || '', medicalConditions: data.medical_conditions || '',
          medications: data.medications || '', insuranceProvider: data.insurance_provider || '',
          insuranceNumber: data.insurance_number || ''
        });
      } else { setError('Patient information not found'); }
    } catch (err) {
      setError('Failed to load patient information');
    } finally { setLoading(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 mesh-gradient">
        <Card className="glass-card border-none p-12 text-center max-w-md">
          <Activity className="h-16 w-16 text-rose-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black text-slate-900 mb-2">Access Error</h1>
          <p className="text-slate-500 font-medium">{error || 'Patient data record is empty.'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden mesh-gradient">
      <div className="noise"></div>

      <div className="container mx-auto px-4 py-16 relative z-10 max-w-4xl">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <Badge className="mb-4 px-4 py-1 bg-emerald-500/10 text-emerald-600 border-emerald-200 text-xs font-black rounded-full uppercase tracking-tighter">Verified Clinical Record</Badge>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 tracking-tight">Patient <span className="text-gradient">Health Profile</span></h1>
          <p className="text-slate-500 font-medium uppercase text-xs tracking-[0.2em]">Authorized Personnel Internal Use Only</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <motion.div {...fadeInUp} className="md:col-span-1">
            <Card className="glass-card border-none bg-slate-900 text-white p-8 h-full">
              <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mb-6">
                <User className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-black mb-1">{profileData.fullName}</h2>
              <p className="text-slate-400 font-bold text-sm mb-6">{profileData.gender.toUpperCase()} • {profileData.bloodType || 'N/A'}</p>
              <div className="space-y-4 pt-6 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase">Birth Date</p>
                    <p className="text-sm font-bold">{profileData.dateOfBirth}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase">Primary Phone</p>
                    <p className="text-sm font-bold">{profileData.phone}</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="md:col-span-2 space-y-8">
            <Card className="glass-card border-none overflow-hidden">
              <CardHeader className="p-8 pb-4 border-b border-white/10">
                <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <Heart className="h-6 w-6 text-rose-500" /> Clinical History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="p-6 bg-rose-500/5 rounded-2xl border border-rose-200/50">
                  <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center">
                    <Activity className="h-3 w-3 mr-2" /> Critical Allergies
                  </h4>
                  <p className="text-slate-900 font-black text-lg">
                    {profileData.allergies || "No Known Drug Allergies (NKDA)"}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Chronic Conditions</h4>
                    <p className="text-slate-700 font-bold leading-relaxed">{profileData.medicalConditions || "None Reported"}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Active Medications</h4>
                    <p className="text-slate-700 font-bold leading-relaxed">{profileData.medications || "None Reported"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-2 gap-8">
              <Card className="glass-card border-none">
                <CardContent className="p-8">
                  <Shield className="h-8 w-8 text-emerald-500 mb-4" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Insurance</h4>
                  <p className="text-slate-900 font-black">{profileData.insuranceProvider || "Public Health/Self"}</p>
                  <p className="text-xs font-bold text-slate-500 mt-1">{profileData.insuranceNumber || "No ID Recorded"}</p>
                </CardContent>
              </Card>
              <Card className="glass-card border-none">
                <CardContent className="p-8">
                  <Phone className="h-8 w-8 text-amber-500 mb-4" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Emergency Hub</h4>
                  <p className="text-slate-900 font-black">{profileData.emergencyContact || "Not Specified"}</p>
                  <p className="text-xs font-bold text-slate-500 mt-1">{profileData.emergencyPhone || "No Number"}</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{children}</label>;
}