import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, AlertTriangle, CheckCircle, Brain, Activity, Clock, Shield, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import SymptomInput from "@/components/ui/symptom-input";
import DoctorRecommendation from "@/components/ui/doctor-recommendation";
import type { Symptom, SymptomAnalysis as SymptomAnalysisType, Doctor, Clinic } from "@shared/schema";
import { supabase } from "@/lib/supabase";
import { analyzeSymptomsWithOpenAI } from '@/lib/openai';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.5 }
};

export default function SymptomAnalysis() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState<"input" | "analyzing" | "results">("input");
  const [symptomData, setSymptomData] = useState<Symptom | null>(null);
  const [analysisData, setAnalysisData] = useState<SymptomAnalysisType | null>(null);
  const [rawGeminiResponse, setRawGeminiResponse] = useState<string>("");

  const submitSymptomMutation = useMutation({
    mutationFn: async (data: {
      description: string;
      severity: string;
      duration?: string;
      image?: File;
      additionalNotes?: string;
    }) => {
      const { data: symptom, error: symptomError } = await supabase
        .from('symptoms')
        .insert([{
          description: data.description,
          severity: data.severity,
          duration: data.duration,
          additional_notes: data.additionalNotes,
        }])
        .select()
        .single();

      if (symptomError) throw symptomError;
      setSymptomData(symptom);

      const geminiResult = await analyzeSymptomsWithOpenAI(
        data.description,
        data.severity,
        data.duration,
        data.additionalNotes,
        data.image
      );

      setRawGeminiResponse(geminiResult.rawResponse || '');

      const analysisData = {
        id: crypto.randomUUID(),
        symptom_id: symptom.id,
        analysis_result: geminiResult.analysis,
        confidence: geminiResult.confidence,
        urgency: geminiResult.urgency,
        recommendations: geminiResult.recommendations,
        possible_conditions: geminiResult.possibleConditions,
        recommended_specialty: geminiResult.recommendedSpecialty,
        created_at: new Date().toISOString(),
      };

      const { data: analysis, error: analysisError } = await supabase
        .from('symptom_analyses')
        .insert([analysisData])
        .select()
        .single();

      if (analysisError) throw analysisError;
      setAnalysisData(analysis);

      return { symptom, analysis };
    },
    onSuccess: () => {
      setCurrentStep("results");
    },
    onError: (error) => {
      console.error('Symptom analysis error:', error);
      setCurrentStep("input");
    },
  });

  const { data: doctor } = useQuery({
    queryKey: ["recommended-doctor", analysisData?.recommended_specialty],
    queryFn: async () => {
      if (!analysisData?.recommended_specialty) return null;
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('specialization', analysisData.recommended_specialty)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('doctors')
          .select('*')
          .eq('is_active', true)
          .limit(1)
          .single();

        if (fallbackError) {
          return {
            id: 'mock-doctor',
            name: 'Dr. Sarah Johnson',
            email: 'sarah.johnson@example.com',
            phone: '+1-555-0123',
            clinic_id: 'mock-clinic',
            specialization: analysisData.recommended_specialty,
            bio: `Experienced ${analysisData.recommended_specialty.toLowerCase()} specialist with 15+ years in patient care.`,
            experience_years: 15,
            rating: 4.8,
            is_active: true,
            created_at: new Date().toISOString(),
          };
        }
        return fallbackData;
      }
      return data;
    },
    enabled: !!analysisData,
  });

  const { data: clinic } = useQuery({
    queryKey: ["clinic", doctor?.clinic_id],
    queryFn: async () => {
      if (!doctor?.clinic_id || doctor.clinic_id === 'mock-clinic') {
        return {
          id: 'mock-clinic',
          name: 'City General Hospital',
          address: '123 Main Street, Downtown',
          phone: '+1-555-0123',
          email: 'info@citygeneral.com',
          latitude: '40.7128',
          longitude: '-74.0060',
          current_wait_time: 15,
          queue_size: 3,
          status: 'open',
          is_active: true,
          created_at: new Date().toISOString(),
        };
      }

      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', doctor.clinic_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!doctor,
  });

  return (
    <div className="min-h-screen relative overflow-hidden mesh-gradient">
      <div className="noise"></div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeInUp} className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-6 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>

            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                AI <span className="text-gradient">Symptom Analyzer</span>
              </h1>
              <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
                Discover personalized healthcare recommendations powered by advanced AI analysis.
              </p>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {currentStep === "input" && (
              <motion.div key="input" {...fadeInUp}>
                <SymptomInput
                  onSubmit={(data) => {
                    setCurrentStep("analyzing");
                    submitSymptomMutation.mutate(data);
                  }}
                  isLoading={submitSymptomMutation.isPending}
                />

                <div className="mt-8">
                  <Alert className="glass-card border-none bg-amber-500/10 text-amber-900">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <AlertDescription className="ml-2 font-medium">
                      <strong>Medical Disclaimer:</strong> This tool provides general recommendations and is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for medical concerns.
                    </AlertDescription>
                  </Alert>
                </div>
              </motion.div>
            )}

            {currentStep === "analyzing" && (
              <motion.div
                key="analyzing"
                {...fadeInUp}
                className="text-center py-20 glass-card border-none"
              >
                <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                  <div className="relative bg-white rounded-full p-6 shadow-xl">
                    <Brain className="h-10 w-10 text-primary animate-pulse" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Analyzing Your Symptoms...
                </h2>
                <p className="text-slate-600 font-medium max-w-sm mx-auto leading-relaxed">
                  Our AI is processing your information to find the most accurate healthcare recommendations.
                </p>
              </motion.div>
            )}

            {currentStep === "results" && analysisData && doctor && clinic && (
              <motion.div key="results" {...fadeInUp} className="space-y-8">
                <Alert className="glass-card border-none bg-emerald-500/10 text-emerald-900">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <AlertDescription className="ml-2 font-semibold">
                    Analysis complete! Find our detailed assessment and recommendations below.
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="premium-card bg-white p-6 md:p-8">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center mb-4">
                      <Activity className="h-4 w-4 mr-2 text-rose-500" />
                      Urgency Data
                    </span>
                    <p className={`text-3xl md:text-4xl font-black ${analysisData.urgency?.toLowerCase().includes('high') || analysisData.urgency?.toLowerCase().includes('emergency')
                      ? 'text-rose-600'
                      : 'text-emerald-500'
                      }`}>
                      {analysisData.urgency}
                    </p>
                  </div>

                  <div className="premium-card bg-white p-6 md:p-8">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center mb-4">
                      <Sparkles className="h-4 w-4 mr-2 text-indigo-500" />
                      AI Confidence
                    </span>
                    <p className="text-3xl md:text-4xl font-black text-indigo-600">
                      {analysisData.confidence}%
                    </p>
                  </div>

                  <div className="premium-card bg-white p-6 md:p-8">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center mb-4">
                      <Shield className="h-4 w-4 mr-2 text-emerald-500" />
                      Recommended
                    </span>
                    <p className="text-3xl md:text-4xl font-black text-slate-900 truncate">
                      {analysisData.recommended_specialty || "General"}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="premium-card bg-white overflow-hidden p-8 md:p-12">
                    <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight flex items-center gap-3">
                      <Brain className="h-7 w-7 text-indigo-600" /> Analysis Summary
                    </h3>
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">CLINICAL ASSESSMENT</h4>
                        <p className="text-slate-700 leading-relaxed font-bold text-lg">
                          {analysisData.analysis_result}
                        </p>
                      </div>

                      {analysisData.possible_conditions && (analysisData.possible_conditions.length > 0) && (
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">POTENTIAL CONDITIONS</h4>
                          <div className="flex flex-wrap gap-2">
                            {(analysisData.possible_conditions as string[]).map((cond, i) => (
                              <span key={i} className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                {cond}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="premium-card bg-white p-8 md:p-12">
                    <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight flex items-center gap-3">
                      <Clock className="h-7 w-7 text-emerald-500" /> Next Steps
                    </h3>
                    <div className="bg-emerald-50/50 rounded-3xl p-8 border border-emerald-100/50">
                      <h4 className="text-emerald-700 font-black text-[10px] uppercase tracking-widest mb-4">Clinical Protocol</h4>
                      <p className="text-slate-700 leading-relaxed font-bold text-lg italic">
                        "{analysisData.recommendations}"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <Users className="h-6 w-6 mr-3 text-primary" />
                    Recommended Doctor
                  </h3>
                  <DoctorRecommendation
                    doctor={doctor}
                    clinic={clinic}
                    confidence={analysisData.confidence || 0}
                    analysisResult={analysisData.analysis_result}
                    urgency={analysisData.urgency}
                    onBookAppointment={(id) => navigate(`/clinics?doctor=${id}&book=true`)}
                  />
                </div>

                <div className="flex justify-center flex-col sm:flex-row gap-4 pt-8">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentStep("input");
                      setSymptomData(null);
                      setAnalysisData(null);
                    }}
                    className="h-12 px-8 rounded-xl font-bold"
                  >
                    Analyze Different Symptoms
                  </Button>
                  <Button
                    onClick={() => navigate("/clinics")}
                    className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20"
                  >
                    View All Clinics
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {submitSymptomMutation.isError && (
            <motion.div
              {...fadeInUp}
              className="text-center py-12"
            >
              <Alert variant="destructive" className="max-w-md mx-auto glass-card border-red-200 bg-red-50">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription className="font-medium">
                  {submitSymptomMutation.error?.message || "An unexpected error occurred. Please try again."}
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => setCurrentStep("input")}
                className="mt-6 font-bold"
              >
                Try Again
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
