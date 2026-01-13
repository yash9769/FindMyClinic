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
import authSide from "@/images/auth-side.png";

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

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-white">
      {/* Left Side - Hero Section */}
      <div className="hidden md:flex w-1/2 relative bg-slate-900 overflow-hidden">
        <img
          src={authSide}
          alt="Healthcare Simplified"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 relative bg-white">
        {/* Logo Top Right */}
        <div className="absolute top-12 right-12 flex items-center gap-1">
          <span className="text-xl font-bold text-slate-800 tracking-tight">FindMy</span>
          <span className="text-xl font-bold text-teal-600 tracking-tight">Clinic</span>
        </div>

        <div className="w-full max-w-sm space-y-6 mt-8">
          <div className="space-y-5">
            {/* Email Input */}
            <div className="space-y-1.5">
              <Label className="text-slate-500 font-medium text-sm">Email</Label>
              <Input
                name="email"
                type="email"
                placeholder=""
                className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl transition-all"
                onChange={(e) => {
                  // Just to ensure capturing input if needed, though we primarily handle via form submission if wrapped
                }}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <Label className="text-slate-500 font-medium text-sm">Password</Label>
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder=""
                  className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.84 0 1.68-.09 2.48-.26" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Google Button */}
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
              className="w-full h-12 bg-[#4285F4] hover:bg-[#3b77db] text-white font-medium shadow-md shadow-blue-500/20 rounded-full mt-4"
              disabled={loading}
            >
              <div className="bg-white p-1 rounded-full mr-2">
                <Chrome className="h-4 w-4 text-[#4285F4]" />
              </div>
              Sign in with Google
            </Button>

            {/* Separator */}
            <div className="relative flex items-center py-2">
              <span className="w-full border-t border-slate-200" />
              <span className="px-3 text-xs text-slate-400 bg-white">or</span>
              <span className="w-full border-t border-slate-200" />
            </div>

            {/* Email Sign In Button */}
            <Button
              onClick={(e) => {
                // Find inputs and trigger sign in
                // In a real controlled form we'd use state, but here capturing from DOM for simplicity with the "fake form" structure requested
                const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
                const passInput = document.querySelector('input[name="password"]') as HTMLInputElement;
                if (emailInput?.value && passInput?.value) {
                  signIn(emailInput.value, passInput.value).then(({ error }) => {
                    if (error) setError(error.message);
                    else setLocation('/home');
                  });
                } else {
                  setError("Please enter both email and password");
                }
              }}
              variant="outline"
              className="w-full h-12 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-full font-medium"
              disabled={loading}
            >
              Sign in with Email
            </Button>

            {error && (
              <Alert variant="destructive" className="mt-4 border-none bg-red-50 text-red-600">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
