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
      <div className="hidden md:flex w-1/2 bg-slate-900 relative flex-col justify-between p-12 text-white overflow-hidden">
        {/* Background Gradients/Effects */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-teal-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-40" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full justify-center">
          <div className="flex items-center gap-3 mb-12 absolute top-12 left-12">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
              <Chrome className="w-6 h-6 text-teal-400" />
            </div>
            <span className="text-xl font-bold font-display tracking-tight">FindMyClinic</span>
          </div>

          <div className="mt-8">
            <img
              src="/src/images/login-hero.png"
              alt="Healthcare Simplified"
              className="w-full max-w-[400px] mx-auto mb-8 rounded-2xl shadow-2xl border border-white/10 glass-card animate-in fade-in zoom-in duration-700"
            />
            <h1 className="text-5xl font-bold font-display leading-[1.1] mb-6 tracking-tight">
              Healthcare <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400">
                Simplified
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed">
              Experience the next generation of clinic management. Join queues remotely, track live status, and get AI-powered health insights.
            </p>
          </div>
        </div>

        {/* Footer/Testimonial-ish */}
        <div className="relative z-10 mt-auto">
          <div className="flex gap-4 items-center">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-xs font-medium text-slate-400">
                  {i}
                </div>
              ))}
            </div>
            <div className="text-sm text-slate-400">
              <span className="text-white font-semibold">2,000+</span> patients trust us
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 relative bg-slate-50/30">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              {authMethod === 'email'
                ? 'Continue with Email'
                : authMethod === 'google'
                  ? 'Sign in with Google'
                  : 'Welcome Back'}
            </h2>
            <p className="mt-2 text-slate-500">
              {!authMethod ? 'Choose your preferred method to sign in' : 'Please enter your details to access your account'}
            </p>
          </div>

          <div className="mt-8">
            {/* Auth Method Selection - Default View */}
            {!authMethod && (
              <div className="space-y-4">
                <Button
                  onClick={() => setAuthMethod('google')}
                  variant="outline"
                  className="w-full h-14 text-base relative group overflow-hidden border-slate-200 hover:border-slate-300 hover:bg-white transition-all duration-300"
                  disabled={loading}
                >
                  <div className="absolute inset-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-5" />
                  <Chrome className="mr-3 h-5 w-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                  <span className="text-slate-700 font-medium group-hover:text-slate-900">Continue with Google</span>
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-50/30 px-2 text-slate-400">Or</span>
                  </div>
                </div>

                <Button
                  onClick={() => setAuthMethod('email')}
                  className="w-full h-14 text-base bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all duration-300 hover:scale-[1.02]"
                  disabled={loading}
                >
                  <Mail className="mr-3 h-5 w-5" />
                  Continue with Email
                </Button>
              </div>
            )}

            {/* Google Auth View */}
            {authMethod === 'google' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Chrome className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Patient Access</h3>
                    <p className="text-sm text-slate-500">Secure sign-in via Google</p>
                  </div>
                </div>

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
                  className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Confirm & Sign In'}
                </Button>

                <Button
                  onClick={() => setAuthMethod(null)}
                  variant="ghost"
                  className="w-full text-slate-500 hover:text-slate-900"
                >
                  ← Go back
                </Button>
              </div>
            )}

            {/* Email Auth View */}
            {authMethod === 'email' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100/50 p-1">
                    <TabsTrigger value="signin" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign In</TabsTrigger>
                    <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Create Account</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-slate-600 font-medium">Email Address</Label>
                        <Input
                          id="signin-email"
                          name="email"
                          type="email"
                          required
                          className="h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                          placeholder="name@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="signin-password" className="text-slate-600 font-medium">Password</Label>
                          <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Forgot?</a>
                        </div>
                        <Input
                          id="signin-password"
                          name="password"
                          type="password"
                          required
                          className="h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                          placeholder="••••••••"
                        />
                      </div>
                      {error && (
                        <Alert variant="destructive" className="bg-red-50 border-red-100 text-red-600">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      <Button type="submit" className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-base" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign In
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-slate-600">Full Name</Label>
                        <Input id="signup-name" name="name" type="text" required className="h-11 bg-white" placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-slate-600">Email Address</Label>
                        <Input id="signup-email" name="email" type="email" required className="h-11 bg-white" placeholder="name@example.com" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-slate-600">Password</Label>
                          <Input id="signup-password" name="password" type="password" required className="h-11 bg-white" placeholder="••••••" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-confirm-password" className="text-slate-600">Confirm</Label>
                          <Input id="signup-confirm-password" name="confirmPassword" type="password" required className="h-11 bg-white" placeholder="••••••" />
                        </div>
                      </div>
                      {error && (
                        <Alert variant={error?.includes('email') ? 'default' : 'destructive'} className={error?.includes('email') ? "bg-blue-50 border-blue-100 text-blue-600" : ""}>
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base shadow-lg shadow-blue-600/20" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Account
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <Button
                  onClick={() => setAuthMethod(null)}
                  variant="ghost"
                  className="w-full mt-6 text-slate-400 hover:text-slate-900"
                >
                  ← Choose another method
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Links */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 text-xs text-slate-400">
          <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Help Center</a>
        </div>
      </div>
    </div>
  );
}
