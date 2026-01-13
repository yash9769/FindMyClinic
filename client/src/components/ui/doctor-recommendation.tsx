import { useState } from "react";
import { Star, MapPin, Clock, Phone, User, Award, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Doctor, Clinic } from "@shared/schema";
import { motion } from "framer-motion";

interface DoctorRecommendationProps {
  doctor: Doctor;
  clinic: Clinic;
  confidence: number;
  analysisResult: string;
  urgency: string;
  onBookAppointment: (doctorId: string) => void;
}

export default function DoctorRecommendation({
  doctor,
  clinic,
  confidence,
  analysisResult,
  urgency,
  onBookAppointment,
}: DoctorRecommendationProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case "emergency": return "bg-red-500/10 text-red-600 border-red-200";
      case "urgent": return "bg-orange-500/10 text-orange-600 border-orange-200";
      case "routine": return "bg-blue-500/10 text-blue-600 border-blue-200";
      default: return "bg-slate-500/10 text-slate-600 border-slate-200";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full"
    >
      <Card className="glass-card border-none shadow-2xl overflow-hidden group">
        <div className="h-1.5 bg-gradient-to-r from-primary to-secondary"></div>
        <CardHeader className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center border border-white/40 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-success text-white p-1 rounded-full border-4 border-white shadow-lg">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>

              <div>
                <CardTitle className="text-2xl font-black text-slate-900 mb-2">{doctor.name}</CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center bg-yellow-400/10 px-2 py-1 rounded-lg">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < (doctor.rating || 0) ? "text-yellow-500 fill-current" : "text-slate-300"
                          }`}
                      />
                    ))}
                    <span className="ml-2 font-bold text-yellow-700 text-sm">{doctor.rating || 0}</span>
                  </div>
                  <Badge variant="outline" className={`font-bold px-3 py-1 rounded-full ${getUrgencyColor(urgency)}`}>
                    {urgency.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end">
              <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Match Accuracy</div>
              <div className="text-3xl font-black text-gradient">
                {confidence}%
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 pt-0 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center">
                  <Award className="h-3 w-3 mr-2" />
                  Clinical Context
                </h4>
                <p className="text-slate-700 font-medium leading-relaxed italic">
                  "{analysisResult}"
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{clinic.name}</p>
                    <p className="text-sm text-slate-500 font-medium">{clinic.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Clock className="h-5 w-5 text-slate-500" />
                  </div>
                  <p className="font-bold text-slate-900">
                    {doctor.experience_years || 5}+ Years Professional Experience
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">About the Doctor</h4>
                <p className="text-slate-600 font-medium leading-relaxed line-clamp-4">
                  {doctor.bio || "Specialized healthcare professional dedicated to providing comprehensive patient care and personalized treatment plans."}
                </p>
              </div>

              <div className="flex gap-4 pt-2">
                <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-slate-200 hover:bg-slate-50 transition-all">
                      View Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg glass-card border-none p-0 overflow-hidden">
                    <div className="h-2 bg-primary"></div>
                    <div className="p-8 space-y-8">
                      <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-slate-900">{doctor.name}</DialogTitle>
                        <p className="text-primary font-bold">{doctor.specialization}</p>
                      </DialogHeader>

                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-2xl">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Practice</h4>
                            <p className="font-bold text-slate-900">{clinic.name}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Contact</h4>
                            <p className="font-bold text-slate-900">{doctor.phone || clinic.phone}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Professional Biography</h4>
                          <p className="text-slate-600 font-medium leading-relaxed">
                            {doctor.bio || "A highly skilled medical professional with a focus on patient-centered care and evidence-based medicine."}
                          </p>
                        </div>

                        <div className="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-200">
                          <h4 className="text-emerald-700 font-bold mb-2 flex items-center">
                            <Sparkles className="h-4 w-4 mr-2" />
                            AI Clinical Match
                          </h4>
                          <p className="text-emerald-800 text-sm font-medium leading-relaxed">
                            {analysisResult}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          setIsDetailsOpen(false);
                          onBookAppointment(doctor.id);
                        }}
                        className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
                      >
                        Book Appointment Now
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={() => onBookAppointment(doctor.id)}
                  className="flex-[2] h-14 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.02] transition-all"
                >
                  Book Appointment
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Helper icons missing in imports
function Sparkles(props: any) {
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
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
