import React from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, Activity, BarChart2, BookOpen, Cpu, MessageSquare,
  Menu, X, Wind, User, Calculator, Users, Sun, Moon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/theme";

interface NavigationShellProps {
  children: React.ReactNode;
}

export default function NavigationShell({ children }: NavigationShellProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const navItems = [
    { href: "/",           label: "Dashboard",   icon: BarChart2,    accent: "#059669" },
    { href: "/test",       label: "Run Test",    icon: Activity,     accent: "#2563EB" },
    { href: "/chat",       label: "AI Assistant",icon: MessageSquare,accent: "#7c3aed" },
    { href: "/education",  label: "Education",   icon: BookOpen,     accent: "#0891b2" },
    { href: "/calculator", label: "Calculator",  icon: Calculator,   accent: "#0f766e" },
    { href: "/family",     label: "Family",      icon: Users,        accent: "#be185d" },
    { href: "/profile",    label: "Profile",     icon: User,         accent: "#D97706" },
  ];

  // Adaptive colors based on theme
  const headerBg       = isDark ? "rgba(10, 14, 26, 0.85)"     : "rgba(255, 255, 255, 0.85)";
  const headerBorder   = isDark ? "rgba(255, 255, 255, 0.06)"  : "rgba(27, 45, 107, 0.08)";
  const textPrimary    = isDark ? "white"                      : "#0F172A";
  const textMuted      = isDark ? "#475569"                    : "#94A3B8";
  const appBg          = isDark ? "hsl(220,27%,8%)"            : "#F0F4FF";

  return (
    <div className="min-h-screen font-sans flex flex-col relative overflow-hidden" style={{ background: appBg }}>
      {/* Background layered gradient orbs */}
      <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none z-0" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none z-0 opacity-30"
        style={{ background: isDark ? "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)" : "radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)", filter: "blur(40px)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none z-0 opacity-20"
        style={{ background: isDark ? "radial-gradient(circle, rgba(5,150,105,0.15) 0%, transparent 70%)" : "radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 70%)", filter: "blur(60px)" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-[#F0F4FF]/20 to-[#F0F4FF]/60 pointer-events-none z-0" />
      
      {/* ────────── TOP STICKY HEADER (PC & Mobile) ────────── */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl print:hidden"
        style={{ 
          background: headerBg, 
          borderBottom: `1px solid ${headerBorder}`, 
          boxShadow: isDark ? "0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)" : "0 1px 0 rgba(255,255,255,0.9), 0 4px 24px rgba(27,45,107,0.06)" 
        }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: "linear-gradient(135deg, #1B2D6B, #2563EB)", boxShadow: "0 4px 16px rgba(27,45,107,0.3)" }}>
                  <Wind className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 animate-pulse"
                  style={{ borderColor: isDark ? "rgb(10,14,26)" : "#FFFFFF" }} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-black tracking-tight leading-none mb-0.5" style={{ color: textPrimary }}>ReVive</h1>
                <span className="text-[9px] uppercase font-bold tracking-widest block" style={{ color: textMuted }}>Diagnostics Portal</span>
              </div>
            </div>
          </Link>

          {/* Desktop Horizontal Nav Links */}
          <nav className="hidden lg:flex items-center gap-1.5 px-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <span className="relative flex items-center gap-2 px-3.5 py-2 rounded-full cursor-pointer font-bold text-xs uppercase tracking-wider transition-all duration-200 group">
                    {isActive && (
                      <motion.div layoutId="active-nav-pill-top"
                        className="absolute inset-0 rounded-full"
                        style={{ 
                          background: isDark ? `${item.accent}1c` : `${item.accent}0d`, 
                          border: `1px solid ${item.accent}25` 
                        }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                    )}
                    {!isActive && (
                      <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                        style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(27,45,107,0.04)" }} />
                    )}

                    <Icon className="w-3.5 h-3.5 relative z-10"
                      style={{ color: isActive ? item.accent : (isDark ? "#64748b" : "#94A3B8") }} />
                    
                    <span className="relative z-10" 
                      style={{ color: isActive ? item.accent : (isDark ? "#94a3b8" : "#475569") }}>
                      {item.label}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Theme toggle, Status pill, and Mobile menu button */}
          <div className="flex items-center gap-2.5">
            {/* Status light */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider"
              style={{ 
                background: isDark ? "rgba(5,150,105,0.06)" : "rgba(5,150,105,0.05)", 
                borderColor: isDark ? "rgba(5,150,105,0.18)" : "rgba(5,150,105,0.2)",
                color: "#059669"
              }}>
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>Online</span>
            </div>

            {/* Dark mode toggle */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-xl transition-all cursor-pointer border"
              style={{ 
                background: isDark ? "rgba(255,255,255,0.06)" : "#FFFFFF", 
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(27,45,107,0.10)",
                color: isDark ? "#94a3b8" : "#64748b",
                boxShadow: isDark ? "none" : "0 2px 8px rgba(27,45,107,0.06)"
              }}>
              {isDark 
                ? <Sun className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4 text-slate-500" />
              }
            </motion.button>

            {/* Mobile menu button */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl transition-all cursor-pointer border"
              style={{ 
                background: isDark ? "rgba(255,255,255,0.025)" : "#FFFFFF", 
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(27,45,107,0.08)",
                color: textPrimary
              }}>
              {isMobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drop-down menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: "auto" }} 
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-x-0 top-[73px] z-30 flex flex-col p-4 gap-1.5 shadow-xl border-b overflow-hidden"
            style={{
              background: isDark ? "rgba(10,14,26,0.95)" : "rgba(255,255,255,0.95)",
              borderColor: headerBorder,
              backdropFilter: "blur(20px)"
            }}>
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="flex items-center gap-3.5 px-4 py-3 rounded-xl cursor-pointer font-bold text-xs uppercase tracking-wider transition-all"
                    style={isActive ? {
                      background: `${item.accent}0f`,
                      border: `1px solid ${item.accent}25`,
                      color: item.accent
                    } : { color: isDark ? "#94a3b8" : "#475569" }}>
                    <Icon className="w-4.5 h-4.5" style={isActive ? { color: item.accent } : {}} />
                    <span>{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ────────── Main Content Container ────────── */}
      <main className="flex-1 flex flex-col w-full min-w-0 relative z-10">
        <div className="flex-1 pb-24 lg:pb-8 pt-4">
          {children}
        </div>

        {/* Mobile bottom tab navigation (for ease of use, showing top 5 tabs) */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 py-2.5 px-2 flex justify-around items-center z-30 border-t backdrop-blur-md print:hidden"
          style={{
            background: isDark ? "rgba(10,14,26,0.9)" : "rgba(255,255,255,0.9)",
            borderColor: headerBorder,
            boxShadow: isDark ? "0 -8px 32px rgba(0,0,0,0.5)" : "0 -4px 20px rgba(27,45,107,0.06)"
          }}>
          {navItems.slice(0, 5).map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <span className="flex flex-col items-center gap-1 cursor-pointer px-2 py-0.5 relative transition-all">
                  {isActive && (
                    <motion.div layoutId="mobile-active-top-nav"
                      className="absolute -inset-1 rounded-xl pointer-events-none"
                      style={{ background: `${item.accent}0f`, border: `1px solid ${item.accent}20` }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                  )}
                  <div className={`p-1.5 rounded-lg relative z-10 transition-all ${isActive ? "scale-110" : ""}`}
                    style={isActive ? { color: item.accent } : { color: isDark ? "#475569" : "#94A3B8" }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black tracking-tight relative z-10 transition-colors uppercase"
                    style={isActive ? { color: item.accent } : { color: isDark ? "#475569" : "#94A3B8" }}>
                    {item.label.length > 8 ? item.label.split(" ")[0] : item.label}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
