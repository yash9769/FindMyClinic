import { Goal, Eye, Heart, Users, Award, Lightbulb, Target, Shield, Zap, MapPin, Globe, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TeamMember from "@/components/ui/team-member";
import type { TeamMember as TeamMemberType } from "@/lib/types";
import { motion } from "framer-motion";
import yashodhanPhoto from "@/images/yash.jpeg";
import kaiPhoto from "@/images/Kai.jpeg";
import swaraPhoto from "@/images/swara.jpeg";
import aboutBg from "@/images/abo.jpg";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: "easeOut" }
};

export default function About() {
  const teamMembers: TeamMemberType[] = [
    {
      name: "Yashodhan Rajapkar",
      role: "Founder & Lead Developer",
      image: yashodhanPhoto,
      bio: "Innovative lead developer bridging healthcare and digital intelligence."
    },
    {
      name: "Kaivalya Gharat",
      role: "Co-Founder & Developer",
      image: kaiPhoto,
      bio: "Product visionary focused on seamless human-centric medical design."
    },
    {
      name: "Swarali Mahishi",
      role: "Co-Founder & Developer",
      image: swaraPhoto,
      bio: "Passionate engineer dedicated to scaling accessibility across diverse communities."
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Reverted Background with abo.jpg */}
      <div className="fixed inset-0 z-0">
        <img src={aboutBg} className="w-full h-full object-cover filter brightness-[0.25]" alt="" />
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"></div>
      </div>

      <div className="noise opacity-[0.04]"></div>

      <div className="relative z-10">
        {/* Core Hero */}
        <section className="py-24 md:py-40">
          <div className="container mx-auto px-4">
            <motion.div {...fadeInUp} className="max-w-5xl mx-auto text-center">
              <Badge className="mb-8 px-5 py-2 bg-primary/20 text-white border-white/20 text-[10px] font-black rounded-full uppercase tracking-[0.3em] backdrop-blur-xl">
                Our Clinical Mission
              </Badge>
              <h1 className="text-6xl md:text-9xl font-black text-white mb-10 leading-none tracking-tighter drop-shadow-2xl">
                The <span className="text-primary italic">Story</span>
              </h1>
              <p className="text-xl md:text-3xl text-white/70 max-w-3xl mx-auto font-medium leading-relaxed">
                Architecting a global healthcare ecosystem where clinical sessions are predictable and waiting is a relic of the past.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Global Impact */}
        <section className="py-24 bg-white/5 backdrop-blur-2xl border-y border-white/10">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-12 max-w-6xl mx-auto text-center">
              {[
                { label: "Active Clinics", val: "200+", icon: Globe },
                { label: "Patients Reached", val: "50k+", icon: Users },
                { label: "Hours Saved", val: "1.2m", icon: Zap },
                { label: "Critical Care", val: "100%", icon: Shield }
              ].map((stat, i) => (
                <motion.div key={i} {...fadeInUp} transition={{ delay: i * 0.1 }}>
                  <div className="flex justify-center mb-6">
                    <stat.icon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-4xl font-black text-white mb-2">{stat.val}</h3>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Vision & Mission Cards */}
        <section className="py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
              <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <Card className="glass-card border-none bg-white/95 backdrop-blur-3xl rounded-[3rem] overflow-hidden shadow-2xl h-full p-12">
                  <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-10">
                    <Goal className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">The Mission</h3>
                  <p className="text-xl text-slate-600 font-medium leading-relaxed mb-8">
                    To synchronize the world's medical availability with patient demand in real-time, removing the anxiety of the unknown from professional healthcare.
                  </p>
                  <div className="flex gap-4">
                    <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-full bg-primary origin-left scale-x-[0.3] rounded-full"></div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <Card className="glass-card border-none bg-slate-900/95 backdrop-blur-3xl rounded-[3rem] overflow-hidden shadow-2xl h-full p-12 text-white">
                  <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center mb-10 text-white">
                    <Eye className="h-10 w-10" />
                  </div>
                  <h3 className="text-4xl font-black mb-8 tracking-tight">The Vision</h3>
                  <p className="text-xl text-white/70 font-medium leading-relaxed mb-8">
                    Building the ultimate universal health identity and check-in standard that allows any clinic to serve any patient instantly and securely.
                  </p>
                  <div className="flex gap-4">
                    <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-full bg-primary origin-left scale-x-[0.6] rounded-full"></div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Execution Team */}
        <section className="py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <motion.div {...fadeInUp} className="text-center mb-24">
                <h2 className="text-5xl font-black text-white mb-6">Execution <span className="text-primary">Team</span></h2>
                <p className="text-white/60 font-bold uppercase tracking-widest text-xs">Architects of the digital clinic revolution</p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-16">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="relative group"
                  >
                    <div className="absolute -inset-4 bg-primary/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <TeamMember member={member} index={index} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Narrative Section */}
        <section className="py-40 bg-white/95 backdrop-blur-3xl">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div {...fadeInUp} className="space-y-12">
                <div className="flex items-center gap-6">
                  <div className="h-[2px] w-20 bg-slate-200"></div>
                  <span className="font-black text-slate-400 uppercase tracking-[0.3em] text-[10px]">The Narrative</span>
                </div>
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
                  Driven by Experience,<br />
                  <span className="text-primary">Defined by Impact.</span>
                </h2>
                <div className="prose prose-2xl text-slate-600 font-medium leading-loose space-y-8">
                  <p>
                    Find My Clinic emerged from the frustration of local clinic chaos. Our founders saw how fragmented scheduling and lack of live data burdened both patients in pain and doctors in pressure.
                  </p>
                  <p className="text-slate-900 font-black border-l-8 border-primary pl-10 py-4 italic">
                    "We aren't just building a queue; we are building trust in the medical journey."
                  </p>
                  <p>
                    Our technology bridges the infrastructure gap using AI-driven throughput modeling and QR-based clinical passports. Every code committed is a step towards a world without waiting rooms.
                  </p>
                </div>
                <div className="pt-12">
                  <Badge className="bg-slate-100 text-slate-500 border-none font-black px-6 py-3 rounded-2xl tracking-widest">EST. 2024</Badge>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
