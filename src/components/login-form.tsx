import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "../store/themeStore";


const taskQuotations = [
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The way to get started is to quit talking and begin doing.",
  "Don't be afraid to give up the good to go for the great.",
  "Innovation distinguishes between a leader and a follower.",
  "The only impossible journey is the one you never begin.",
  "It does not matter how slowly you go as long as you do not stop.",
  "Everything you've ever wanted is on the other side of fear.",
  "Believe you can and you're halfway there.",
  "The future depends on what you do today.",
  "A goal without a plan is just a wish.",
];

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuote, setCurrentQuote] = useState("");
  const { signIn } = useAuthStore();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const randomQuote = taskQuotations[Math.floor(Math.random() * taskQuotations.length)];
    setCurrentQuote(randomQuote);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email.trim().toLowerCase() !== "ceo@enkonix.in") {
      toast.error("Unauthorized email access");
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      toast.success("Successfully logged in!");
      navigate("/");
    } catch (err) {
      toast.error("Invalid login credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    toast.info(`${provider} login coming soon!`);
  };

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      <Card className="enhanced-moving-border overflow-hidden p-0 shadow-2xl border-2 border-cyan-300 dark:border-purple-500/40 bg-gradient-to-br from-white/85 to-cyan-50/85 dark:bg-gradient-to-br dark:from-purple-900/90 dark:to-purple-800/90 backdrop-blur-2xl relative rounded-3xl">
        {/* Enhanced floating glass icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-8 w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 dark:from-white/15 dark:to-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl animate-float border border-white/30 dark:border-white/20">
            <svg className="w-6 h-6 text-cyan-500/80 dark:text-cyan-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div className="absolute top-40 left-20 w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 dark:from-white/15 dark:to-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center shadow-2xl animate-float-delay-1 border border-white/30 dark:border-white/20">
            <svg className="w-5 h-5 text-orange-500/80 dark:text-orange-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="absolute bottom-32 left-12 w-11 h-11 bg-gradient-to-br from-white/20 to-white/10 dark:from-white/15 dark:to-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl animate-float-delay-2 border border-white/30 dark:border-white/20">
            <svg className="w-5.5 h-5.5 text-pink-500/80 dark:text-pink-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="absolute top-60 left-4 w-9 h-9 bg-gradient-to-br from-white/20 to-white/10 dark:from-white/15 dark:to-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center shadow-2xl animate-float-delay-3 border border-white/30 dark:border-white/20">
            <svg className="w-4 h-4 text-blue-500/80 dark:text-blue-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="absolute bottom-60 left-32 w-8 h-8 bg-gradient-to-br from-white/20 to-white/10 dark:from-white/15 dark:to-white/5 backdrop-blur-xl rounded-lg flex items-center justify-center shadow-2xl animate-float border border-white/30 dark:border-white/20">
            <svg className="w-4 h-4 text-emerald-500/80 dark:text-emerald-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        <CardContent className="grid p-0 md:grid-cols-2 min-h-[650px]">
          {/* Left Side - Login Form */}
          <div className="p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-cyan-50/95 to-orange-50/90 dark:from-purple-900/95 dark:to-purple-800/90 backdrop-blur-2xl relative rounded-l-3xl">
            {/* Enhanced background glass elements */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-16 right-8 w-16 h-16 bg-gradient-to-br from-purple-200/30 to-indigo-200/30 dark:from-purple-800/30 dark:to-indigo-800/30 rounded-3xl backdrop-blur-sm animate-pulse shadow-xl"></div>
              <div className="absolute bottom-20 right-16 w-12 h-12 bg-gradient-to-br from-pink-200/30 to-purple-200/30 dark:from-pink-800/30 dark:to-purple-800/30 rounded-2xl backdrop-blur-sm animate-pulse shadow-xl" style={{animationDelay: '1s'}}></div>
              <div className="absolute top-1/2 right-4 w-10 h-10 bg-gradient-to-br from-blue-200/25 to-cyan-200/25 dark:from-blue-800/25 dark:to-cyan-800/25 rounded-2xl backdrop-blur-sm animate-pulse shadow-lg" style={{animationDelay: '2s'}}></div>
            </div>

            <div className="max-w-sm mx-auto w-full space-y-8 relative z-10">
              {/* Theme Toggle */}
              <div className="flex justify-end">
                <button
                  onClick={toggleTheme}
                  className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-slate-600/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                  title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  {theme === 'light' ? (
                    <Moon className="w-5 h-5 text-purple-600 group-hover:text-purple-700 transition-colors" />
                  ) : (
                    <Sun className="w-5 h-5 text-yellow-500 group-hover:text-yellow-600 transition-colors" />
                  )}
                </button>
              </div>

              {/* Header */}
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto transform rotate-3 hover:rotate-0 transition-all duration-500 backdrop-blur-sm border-2 border-white/30 dark:border-white/20">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent animate-fade-in">
                  LOGIN
                </h1>
                <p className="text-gray-600 dark:text-gray-400 animate-slide-in text-lg">
                  Find out what's the admin's business management app
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 dark:from-purple-400/20 dark:to-indigo-400/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-purple-300/30 dark:border-purple-400/30">
                        <svg className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      Username
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-14 px-5 rounded-2xl border-gray-200/60 dark:border-slate-600/60 bg-white/80 dark:bg-slate-800/80 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 backdrop-blur-sm transition-all duration-300 hover:bg-white/90 dark:hover:bg-slate-700/90 shadow-lg focus:shadow-xl"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 dark:from-purple-400/20 dark:to-indigo-400/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-purple-300/30 dark:border-purple-400/30">
                        <svg className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="*******"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-14 px-5 rounded-2xl border-gray-200/60 dark:border-slate-600/60 bg-white/80 dark:bg-slate-800/80 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 backdrop-blur-sm transition-all duration-300 hover:bg-white/90 dark:hover:bg-slate-700/90 shadow-lg focus:shadow-xl"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 text-white bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-700 hover:via-purple-800 hover:to-indigo-800 rounded-2xl font-semibold shadow-2xl hover:shadow-purple-500/25 transform hover:scale-[1.02] transition-all duration-300 border-0 backdrop-blur-sm text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Login</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  )}
                </Button>
              </form>

              
            </div>
          </div>

          {/* Right Side - Lottie Animation */}
          <div className="relative hidden md:block bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-900 dark:from-slate-800 dark:via-purple-800 dark:to-indigo-900 overflow-hidden rounded-r-3xl">
            {/* Enhanced glass morphism background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 to-indigo-800/90 dark:from-slate-800/90 dark:to-purple-900/90 backdrop-blur-sm"></div>
            
            {/* Enhanced floating task management icons */}
           

            {/* Main Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-white">
              {/* Enhanced Lottie Animation Container */}
              <div className="bg-white/15 backdrop-blur-2xl rounded-[2rem] p-10 mb-8 border-2 border-white/30 shadow-2xl transform hover:scale-105 transition-all duration-500 hover:shadow-purple-500/25">
                <div className="w-56 h-56 rounded-3xl overflow-hidden shadow-2xl">
                  <DotLottieReact
                    src="https://lottie.host/f6c203e3-f55a-4f37-ae40-543cb7429268/Tw28xCsivC.lottie"
                    loop
                    autoplay
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              

              {/* Enhanced Quote */}
              <div className="text-center space-y-6 max-w-sm">
                <p className="text-white/95 text-xl font-medium leading-relaxed backdrop-blur-sm">
                  "{currentQuote}"
                </p>
                
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-gray-500 dark:text-slate-400 text-center text-sm bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-slate-600/20">
        By continuing, you agree to our{" "}
        <a href="#" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline underline-offset-4 transition-colors font-medium">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline underline-offset-4 transition-colors font-medium">
          Privacy Policy
        </a>
      </div>
    </div>
  );
}
