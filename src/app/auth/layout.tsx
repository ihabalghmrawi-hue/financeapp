export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium cinematic background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary green glow */}
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse-soft"
          style={{ animationDuration: '4s' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] animate-pulse-soft"
          style={{ animationDuration: '5s' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />

        {/* Subtle grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="auth-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
        </svg>

        {/* Gradient orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/8 rounded-full blur-[80px]" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-primary/5 rounded-full blur-[60px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 bg-primary/10 backdrop-blur-xl border border-primary/20 shadow-glow-green">
            <svg viewBox="0 0 24 24" fill="hsl(var(--primary))" className="w-8 h-8">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Ezy ERP</h1>
          <p className="text-white/50 text-sm mt-1.5">نظام إدارة متكامل للأعمال التجارية</p>
        </div>

        {children}
      </div>
    </div>
  )
}
