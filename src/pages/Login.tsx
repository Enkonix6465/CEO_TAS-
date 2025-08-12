import { LoginForm } from "../components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-slate-900 dark:via-violet-900/10 dark:to-indigo-900/5 flex items-center justify-center p-4 md:p-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-300/30 dark:bg-violet-500/40 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300/30 dark:bg-purple-600/40 rounded-full blur-3xl"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-indigo-400/30 dark:bg-indigo-400/40 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-violet-400/30 dark:bg-violet-500/40 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-purple-300/30 dark:bg-purple-300/30 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-28 h-28 bg-indigo-300/30 dark:bg-indigo-400/30 rounded-full blur-2xl"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-5xl">
        <LoginForm />
      </div>
    </div>
  );
}
