import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, Chrome } from "lucide-react";
import loginHero from "@/images/login-hero.png";

export default function Auth() {
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [authMethod, setAuthMethod] = useState<'google' | 'email' | null>(null);

  // Redirect if already logged in
  if (user) {
    setLocation('/home');
    return null;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
    } else {
      // Redirect will be handled by the dashboard routing
      setLocation('/home');
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const { data, error } = await signUp(email, password, name);

    if (error) {
      setError(error.message);
    } else {
      if (data?.user && !data.user.email_confirmed_at) {
        setError('Check your email for the confirmation link!');
      } else {
        setLocation('/home');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-white">
      {/* Left Side - Hero Section */}
      <div className="hidden md:flex w-1/2 relative flex-col justify-center items-center p-12 text-white overflow-hidden bg-gradient-to-br from-[#0f4c75] to-[#1b262c]">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-teal-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-blue-600/20 rounded-full blur-[120px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
          <img
            src={loginHero}
            alt="Healthcare Simplified"
            className="w-full max-w-[380px] drop-shadow-2xl animate-float mb-8"
          />
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-4 tracking-tight">
              Healthcare <br />
              Simplified
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed max-w-md mx-auto">
              Experience the next generation of clinic management. Join queues remotely, track live status, and get AI-powered health insights.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 relative bg-white">
        {/* Logo Top Right */}
        <div className="absolute top-8 right-8 flex items-center gap-2">
          <span className="text-xl font-bold text-slate-900 tracking-tight">FindMyClinic</span>
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Chrome className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="w-full max-w-sm space-y-8 mt-12">
          {/* Default Login View (Matches mockup) */}
          <div className="space-y-6">
            {/* Fake Inputs for visual match if no method selected, or act as direct email login ?? 
                 Let's implementation actual functional form that LOOKS like the mockup.
             */}

            {!authMethod ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-600">Email</Label>
                  <Input
                    placeholder=""
                    className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    onChange={(e) => {
                      // If user starts typing, switch to email method implicitly or just store it
                      setAuthMethod('email');
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600">Password</Label>
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder=""
                      className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-4">
                  {/* The mockup shows Google button BLUE and Email button WHITE. 
                         I will make Google the primary visual button for accurate matching, 
                         but functionally it's the Google Auth.
                     */}
                  <Button
                    onClick={() => setAuthMethod('google')}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-600/20"
                    disabled={loading}
                  >
                    <Chrome className="mr-2 h-5 w-5" />
                    Sign in with Google
                  </Button>

                  <div className="relative flex items-center py-2">
                    <span className="w-full border-t border-slate-200" />
                    <span className="px-3 text-xs text-slate-400 uppercase bg-white">or</span>
                    <span className="w-full border-t border-slate-200" />
                  </div>

                  <Button
                    onClick={() => setAuthMethod('email')}
                    variant="outline"
                    className="w-full h-12 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    disabled={loading}
                  >
                    Sign in with Email
                  </Button>
                </div>
              </div>
            ) : (
              /* Active View (If clicked) - Keeping functional logic */
              <>
                <div className="text-left mb-6">
                  <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-blue-600 -ml-2" onClick={() => setAuthMethod(null)}>
                    ← Back
                  </Button>
                  <h2 className="text-2xl font-bold text-slate-900 mt-2">
                    {authMethod === 'email' ? 'Email Sign In' : 'Google Sign In'}
                  </h2>
                </div>

                {authMethod === 'google' && (
                  <div className="text-center space-y-6">
                    <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-blue-800 font-medium mb-4">Complete sign in with your Google account</p>
                      <Button
                        onClick={async () => {
                          setLoading(true);
                          setError(null);
                          localStorage.setItem('pendingUserType', 'patient');
                          const { error } = await signInWithGoogle();
                          if (error) {
                            setError(error.message);
                            setLoading(false);
                          }
                        }}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20"
                        disabled={loading}
                      >
                        <Chrome className="mr-2 h-5 w-5" />
                        Continue to Google
                      </Button>
                    </div>
                  </div>
                )}

                {authMethod === 'email' && (
                  <Tabs defaultValue="signin" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="signin">Sign In</TabsTrigger>
                      <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>
                    <TabsContent value="signin">
                      <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input name="email" type="email" required className="h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label>Password</Label>
                          <Input name="password" type="password" required className="h-11" />
                        </div>
                        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                        <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700" disabled={loading}>
                          {loading && <Loader2 className="animate-spin mr-2" />} Sign In
                        </Button>
                      </form>
                    </TabsContent>
                    <TabsContent value="signup">
                      <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2"><Label>Name</Label><Input name="name" required className="h-11" /></div>
                        <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" required className="h-11" /></div>
                        <div className="space-y-2"><Label>Password</Label><Input name="password" type="password" required className="h-11" /></div>
                        <div className="space-y-2"><Label>Confirm</Label><Input name="confirmPassword" type="password" required className="h-11" /></div>
                        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                        <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700" disabled={loading}>
                          {loading && <Loader2 className="animate-spin mr-2" />} Create Account
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                )}
              </>
            )}
          </div>

          {/* Footer Links */}
          <div className="absolute bottom-6 flex justify-center gap-6 text-xs text-slate-400">
            <a href="#" className="hover:text-slate-600">Privacy</a>
            <a href="#" className="hover:text-slate-600">Terms</a>
            <a href="#" className="hover:text-slate-600">Help</a>
          </div>
        </div>
      </div>
    </div>
  );
}
