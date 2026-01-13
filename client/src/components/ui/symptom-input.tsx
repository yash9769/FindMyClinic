import { useState, useRef } from "react";
import { Camera, Upload, X, FileText, Activity, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface SymptomInputProps {
  onSubmit: (data: {
    description: string;
    severity: string;
    duration: string;
    image?: File;
    additionalNotes?: string;
  }) => void;
  isLoading?: boolean;
}

export default function SymptomInput({ onSubmit, isLoading = false }: SymptomInputProps) {
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("");
  const [duration, setDuration] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !severity) {
      return;
    }

    onSubmit({
      description: description.trim(),
      severity,
      duration: duration || undefined as any,
      image: image || undefined as any,
      additionalNotes: additionalNotes.trim() || undefined,
    });
  };

  const isFormValid = description.trim() && severity;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary via-secondary to-success"></div>
        <CardHeader className="pb-8 pt-10 px-10">
          <CardTitle className="flex items-center gap-3 text-2xl font-black text-slate-900">
            <div className="p-3 bg-primary/10 rounded-xl">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            Describe Your Symptoms
          </CardTitle>
          <p className="text-slate-500 font-medium">Please provide as much detail as possible for accurate analysis.</p>
        </CardHeader>
        <CardContent className="px-10 pb-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-bold uppercase tracking-wider text-slate-600">
                What symptoms are you experiencing? *
              </Label>
              <Textarea
                id="description"
                placeholder="e.g. Sharp pain in lower back for 2 hours, mild fever, dizziness..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[140px] resize-none bg-white/50 border-slate-200 focus:border-primary focus:ring-primary rounded-2xl p-4 text-lg transition-all"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="severity" className="text-sm font-bold uppercase tracking-wider text-slate-600">
                  Severity Level *
                </Label>
                <Select value={severity} onValueChange={setSeverity} required>
                  <SelectTrigger className="h-12 bg-white/50 border-slate-200 rounded-xl px-4 focus:ring-primary">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/20">
                    <SelectItem value="mild" className="focus:bg-primary/10">Mild - Noticeable</SelectItem>
                    <SelectItem value="moderate" className="focus:bg-primary/10">Moderate - Interfering</SelectItem>
                    <SelectItem value="severe" className="focus:bg-primary/10">Severe - Impacting life</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="duration" className="text-sm font-bold uppercase tracking-wider text-slate-600">
                  Duration
                </Label>
                <Input
                  id="duration"
                  placeholder="e.g., 3 days"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="h-12 bg-white/50 border-slate-200 rounded-xl px-4 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-bold uppercase tracking-wider text-slate-600">
                Visual Context (Optional)
              </Label>
              <div className="flex flex-wrap gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-12 px-6 rounded-xl border-slate-200 hover:border-primary hover:text-primary transition-all flex items-center gap-2 group"
                >
                  <Upload className="h-4 w-4 group-hover:-translate-y-1 transition-transform" />
                  Upload Photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-12 px-6 rounded-xl border-slate-200 hover:border-secondary hover:text-secondary transition-all flex items-center gap-2 group"
                >
                  <Camera className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  Take Picture
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageCapture}
                className="hidden"
              />

              {imagePreview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative inline-block mt-2"
                >
                  <img
                    src={imagePreview}
                    alt="Symptom preview"
                    className="h-32 w-32 object-cover rounded-2xl border-4 border-white shadow-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                    className="absolute -top-3 -right-3 h-8 w-8 p-0 rounded-full shadow-lg border-2 border-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="notes" className="text-sm font-bold uppercase tracking-wider text-slate-600">
                Additional Observations
              </Label>
              <Textarea
                id="notes"
                placeholder="Any relevant history, medications, or specific concerns..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="min-h-[100px] resize-none bg-white/50 border-slate-200 rounded-2xl p-4 text-lg transition-all"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-black rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.01] transition-all"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Powering AI Analysis...
                </div>
              ) : (
                "Start Analysis with Gemini"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
