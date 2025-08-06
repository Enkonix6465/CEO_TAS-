import { LoginForm } from "../components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-orange-50 to-cyan-100 dark:from-purple-900/20 dark:via-purple-800/30 dark:to-purple-900/20 flex items-center justify-center p-4 md:p-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-300/30 dark:bg-purple-500/40 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-300/30 dark:bg-purple-600/40 rounded-full blur-3xl"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-cyan-400/30 dark:bg-purple-400/40 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-orange-400/30 dark:bg-purple-500/40 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-cyan-300/30 dark:bg-purple-300/30 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-28 h-28 bg-orange-300/30 dark:bg-purple-400/30 rounded-full blur-2xl"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-5xl">
        <LoginForm />
      </div>
    </div>
  );
}
