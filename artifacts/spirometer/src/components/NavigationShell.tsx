import React from "react";
import { Link, useLocation } from "wouter";
import { 
  Activity, BarChart2, BookOpen,
  MessageSquare, Menu, X, Wind, User, Calculator, Users, Sun, Moon, Stethoscope
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/theme";
import { loadProfile } from "@/lib/storage";

const PremiumLogoIcon = ({ isClinician }: { isClinician: boolean }) => {
  const gradId = isClinician ? "logoClinicianGrad" : "logoPatientGrad";
  const maskId = isClinician ? "logoClinicianMask" : "logoPatientMask";
  return (
    <svg viewBox="0 0 100 100" className="w-7 h-7 shrink-0 transition-transform duration-300 hover:scale-105" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {isClinician ? (
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
        ) : (
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8ED6D6" />
            <stop offset="50%" stopColor="#136c72" />
            <stop offset="100%" stopColor="#0d5b5b" />
          </linearGradient>
        )}
        <mask id={maskId}>
          {/* White retains full opacity */}
          <rect x="0" y="0" width="100" height="100" fill="white" />
          {/* Heartbeat cut line - black stroke masks out the path */}
          <path 
            d="M 5 56 Q 22 48, 32 62 T 48 56 M 52 56 Q 60 64, 67 22 T 74 74 T 80 56 H 95" 
            stroke="black" 
            strokeWidth="5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none"
          />
        </mask>
      </defs>
      
      {/* Lobe elements nested inside the heartbeat mask */}
      <g mask={`url(#${maskId})`}>
        {/* Left Lung Lobe */}
        <path 
          d="M 45 15 C 28 17, 12 30, 8 52 C 5 70, 10 82, 24 88 C 36 92, 45 80, 45 68 Z" 
          fill={`url(#${gradId})`}
        />
        {/* Right Lung Lobe */}
        <path 
          d="M 55 15 C 72 17, 88 30, 92 52 C 95 70, 90 82, 76 88 C 64 92, 55 80, 55 68 Z" 
          fill={`url(#${gradId})`}
        />
        {/* Trachea */}
        <rect x="48" y="18" width="4" height="24" rx="2" fill={`url(#${gradId})`} opacity="0.8" />
      </g>
    </svg>
  );
};

interface NavigationShellProps {
  children: React.ReactNode;
}

export default function NavigationShell({ children }: NavigationShellProps) {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isClinicianMode, setIsClinicianMode] = React.useState(() => localStorage.getItem("revive_clinician_mode") === "true");
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);

  const toggleClinicianMode = () => {
    setIsClinicianMode(prev => {
      const next = !prev;
      localStorage.setItem("revive_clinician_mode", String(next));
      if (next) {
        setLocation("/clinician");
      } else {
        setLocation("/");
      }
      return next;
    });
  };
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [profile, setProfile] = React.useState(() => loadProfile());

  React.useEffect(() => {
    if (showMoreMenu) {
      setProfile(loadProfile());
    }
  }, [showMoreMenu]);

  const patientNavItems = [
    { href: "/",           label: "Dashboard",   icon: BarChart2,    accent: "#059669" },
    { href: "/test",       label: "Run Test",    icon: Activity,     accent: "#2563EB" },
    { href: "/chat",       label: "AI Assistant",icon: MessageSquare,accent: "#7c3aed" },
    { href: "/education",  label: "Education",   icon: BookOpen,     accent: "#0891b2" },
    { href: "/calculator", label: "Calculator",  icon: Calculator,   accent: "#0f766e" },
    { href: "/family",     label: "Family",      icon: Users,        accent: "#be185d" },
    { href: "/profile",    label: "Profile",     icon: User,         accent: "#D97706" },
  ];

  const clinicianNavItems = [
    { href: "/clinician",  label: "Clinician Hub",   icon: Stethoscope,  accent: "#dc2626" },
    { href: "/dashboard",  label: "Patient Records", icon: BarChart2,    accent: "#2563EB" },
    { href: "/education",  label: "References",      icon: BookOpen,     accent: "#0891b2" },
    { href: "/calculator", label: "Calculator",      icon: Calculator,   accent: "#0f766e" },
  ];

  const navItems = isClinicianMode ? clinicianNavItems : patientNavItems;

  // Adaptive colors based on theme
  const headerBg     = isDark ? "rgba(10, 14, 26, 0.85)"    : "rgba(255, 255, 255, 0.85)";
  const headerBorder = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(27, 45, 107, 0.08)";
  const textPrimary  = isDark ? "white"                     : "#0F172A";
  const textMuted    = isDark ? "#475569"                   : "#94A3B8";
  const appBg        = isDark ? "hsl(220,27%,8%)"           : "#F0F4FF";

  return (
    <div className="min-h-screen font-sans flex flex-col relative overflow-hidden bg-grain" style={{ background: appBg }}>
      {/* Background animated mesh gradient orbs (hidden on mobile for 60/120fps performance) */}
      <div className="absolute inset-0 bg-dots opacity-[0.15] pointer-events-none z-0" />
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none z-0 opacity-[0.25] blur-[80px] animate-blob-1 hidden md:block"
        style={{ background: "radial-gradient(circle, #3b82f6 0%, #a855f7 70%)" }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none z-0 opacity-[0.2] blur-[100px] animate-blob-2 hidden md:block"
        style={{ background: "radial-gradient(circle, #10b981 0%, #6366f1 70%)" }} />
      <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] rounded-full pointer-events-none z-0 opacity-[0.15] blur-[90px] animate-blob-3 hidden md:block"
        style={{ background: "radial-gradient(circle, #ec4899 0%, #f43f5e 70%)" }} />
      
      {/* ────────── TOP STICKY HEADER (PC & Mobile) ────────── */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl print:hidden"
        style={{ 
          background: headerBg, 
          borderBottom: `1px solid ${isClinicianMode ? "rgba(220,38,38,0.12)" : headerBorder}`, 
          boxShadow: isDark ? "0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)" : "0 1px 0 rgba(255,255,255,0.9), 0 4px 24px rgba(27,45,107,0.06)" 
        }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-slate-950/5 dark:bg-white/5 border border-slate-200/50 dark:border-slate-800/50"
                  style={{ 
                    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 16px rgba(27,45,107,0.06)" 
                  }}>
                  <PremiumLogoIcon isClinician={isClinicianMode} />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 animate-pulse"
                  style={{ background: isClinicianMode ? "#dc2626" : "#10b981", borderColor: isDark ? "rgb(10,14,26)" : "#FFFFFF" }} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-black tracking-tight leading-none mb-0.5" style={{ color: textPrimary }}>ReVive</h1>
                <span className="text-[9px] uppercase font-bold tracking-widest block" style={{ color: isClinicianMode ? "#dc2626" : textMuted }}>
                  {isClinicianMode ? "Clinician Portal" : "Diagnostics Portal"}
                </span>
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

          {/* Right Section: Portal toggle, Theme toggle, Status pill, Mobile menu */}
          <div className="flex items-center gap-2.5">

            {/* Status light */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider"
              style={{ 
                background: isClinicianMode ? "rgba(220,38,38,0.06)" : (isDark ? "rgba(5,150,105,0.06)" : "rgba(5,150,105,0.05)"), 
                borderColor: isClinicianMode ? "rgba(220,38,38,0.18)" : (isDark ? "rgba(5,150,105,0.18)" : "rgba(5,150,105,0.2)"),
                color: isClinicianMode ? "#dc2626" : "#059669"
              }}>
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isClinicianMode ? "bg-red-400" : "bg-emerald-400"}`}></span>
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isClinicianMode ? "bg-red-500" : "bg-emerald-500"}`}></span>
              </span>
              <span>{isClinicianMode ? "Clinician" : "Online"}</span>
            </div>

            {/* ── Patient / Clinician Portal Toggle (Hidden on mobile, moved to More drawer) ── */}
            <motion.button
              onClick={toggleClinicianMode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={isClinicianMode ? "Switch to Patient Mode" : "Switch to Clinician Mode"}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border"
              style={{ 
                background: isClinicianMode 
                  ? "rgba(220,38,38,0.08)" 
                  : (isDark ? "rgba(255,255,255,0.06)" : "#FFFFFF"),
                borderColor: isClinicianMode 
                  ? "rgba(220,38,38,0.25)" 
                  : (isDark ? "rgba(255,255,255,0.1)" : "rgba(27,45,107,0.10)"),
                color: isClinicianMode ? "#dc2626" : (isDark ? "#94a3b8" : "#64748b"),
                boxShadow: isClinicianMode 
                  ? "0 2px 12px rgba(220,38,38,0.12)"
                  : (isDark ? "none" : "0 2px 8px rgba(27,45,107,0.06)")
              }}
            >
              <Stethoscope className="w-4 h-4 shrink-0" />
              <span className="hidden sm:block text-[10px] font-black uppercase tracking-wider">
                {isClinicianMode ? "Clinician" : "Patient"}
              </span>
              {/* Animated toggle track */}
              <div className="relative w-7 h-4 rounded-full ml-0.5 shrink-0"
                style={{ background: isClinicianMode ? "rgba(220,38,38,0.2)" : (isDark ? "rgba(255,255,255,0.1)" : "rgba(27,45,107,0.08)") }}>
                <motion.div
                  animate={{ x: isClinicianMode ? 13 : 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-0.5 w-3 h-3 rounded-full"
                  style={{ background: isClinicianMode ? "#dc2626" : "#94a3b8" }}
                />
              </div>
            </motion.button>

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

          </div>
        </div>
      </header>

      {/* Bottom sheet for "More" menu on mobile */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
              onClick={() => setShowMoreMenu(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="lg:hidden fixed bottom-0 inset-x-0 rounded-t-[2rem] z-50 p-6 flex flex-col gap-5 border-t overflow-hidden max-h-[85vh] shadow-[0_-10px_40px_rgba(0,0,0,0.15)]"
              style={{
                background: isDark ? "rgba(15, 23, 42, 0.98)" : "rgba(255, 255, 255, 0.98)",
                borderColor: headerBorder,
                backdropFilter: "blur(20px)"
              }}
            >
              {/* Pull handle */}
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto shrink-0 mb-1" />
              
              {/* Profile Overview (Apple Health style) */}
              <div className="flex items-center gap-3.5 p-4 rounded-2xl border text-left"
                style={{
                  background: isDark ? "rgba(255,255,255,0.02)" : "rgba(27,45,107,0.02)",
                  borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(27,45,107,0.06)"
                }}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm bg-gradient-to-tr from-[#1B2D6B] to-[#2563EB]"
                  style={{ boxShadow: isDark ? "none" : "0 4px 12px rgba(37,99,235,0.2)" }}>
                  {profile.name ? profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-black text-slate-800 dark:text-slate-200 block truncate">
                    {profile.name || "ReVive User"}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {profile.age ? `${profile.age} yrs` : "No age set"} • {profile.sex ? profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1) : "Patient"}
                  </span>
                </div>
                <Link href="/profile" onClick={() => setShowMoreMenu(false)}>
                  <button className="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95"
                    style={{ color: textPrimary, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(27,45,107,0.12)" }}>
                    Settings
                  </button>
                </Link>
              </div>

              {/* Grid of remaining items (if any exist) */}
              {navItems.slice(4).length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="text-left">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Additional Features</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {navItems.slice(4).map((item) => {
                      const Icon = item.icon;
                      const isActive = location === item.href;
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setShowMoreMenu(false)}>
                          <button className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border transition active:scale-95 w-full cursor-pointer text-left"
                            style={{
                              background: isActive ? `${item.accent}0e` : (isDark ? "rgba(255,255,255,0.01)" : "rgba(27,45,107,0.01)"),
                              borderColor: isActive ? `${item.accent}25` : (isDark ? "rgba(255,255,255,0.05)" : "rgba(27,45,107,0.06)"),
                              color: isActive ? item.accent : (isDark ? "#94a3b8" : "#475569")
                            }}
                          >
                            <Icon className="w-5 h-5 shrink-0" style={{ color: item.accent }} />
                            <span className="text-[10px] font-bold tracking-tight text-center truncate w-full">{item.label}</span>
                          </button>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* System Preferences Card */}
              <div className="flex flex-col gap-3 border-t pt-4" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(27,45,107,0.06)" }}>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Preferences</h4>
                
                {/* Theme Switcher row */}
                <div className="flex items-center justify-between py-3 px-4 rounded-2xl border text-left"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.01)" : "rgba(27,45,107,0.01)",
                    borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(27,45,107,0.06)"
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-500 shrink-0">
                      {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">Dark Mode</span>
                      <span className="text-[10px] text-slate-400 block">{isDark ? "Enabled" : "Disabled"}</span>
                    </div>
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() => {
                      toggleTheme();
                    }}
                    className="relative w-12 h-6.5 rounded-full transition-all duration-300 cursor-pointer shadow-inner"
                    style={{ background: isDark ? "#2563EB" : "rgba(27,45,107,0.12)" }}
                  >
                    <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm"
                      style={{ left: isDark ? "24px" : "2px" }} />
                  </button>
                </div>

                {/* Portal switcher row */}
                <div className="flex items-center justify-between py-3 px-4 rounded-2xl border text-left"
                  style={{
                    background: isClinicianMode ? "rgba(220,38,38,0.05)" : (isDark ? "rgba(255,255,255,0.01)" : "rgba(27,45,107,0.01)"),
                    borderColor: isClinicianMode ? "rgba(220,38,38,0.15)" : (isDark ? "rgba(255,255,255,0.05)" : "rgba(27,45,107,0.06)")
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: isClinicianMode ? "rgba(220,38,38,0.1)" : "rgba(37,99,235,0.1)",
                        color: isClinicianMode ? "#dc2626" : "#2563eb"
                      }}>
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">Clinician Portal</span>
                      <span className="text-[10px] text-slate-400 block">{isClinicianMode ? "Monitoring mode active" : "Patient mode active"}</span>
                    </div>
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() => {
                      toggleClinicianMode();
                      setShowMoreMenu(false);
                    }}
                    className="relative w-12 h-6.5 rounded-full transition-all duration-300 cursor-pointer shadow-inner"
                    style={{ background: isClinicianMode ? "#dc2626" : "rgba(27,45,107,0.12)" }}
                  >
                    <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm"
                      style={{ left: isClinicianMode ? "24px" : "2px" }} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ────────── Main Content Container ────────── */}
      <main className="flex-1 flex flex-col w-full min-w-0 relative z-10">
        <div className="flex-1 pb-24 lg:pb-8 pt-4">
          {children}
        </div>

        {/* Mobile bottom tab navigation (for ease of use, showing top 5 tabs) */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 py-3 px-2.5 flex justify-around items-center z-30 border-t backdrop-blur-md print:hidden"
          style={{
            background: isDark ? "rgba(10,14,26,0.92)" : "rgba(255,255,255,0.92)",
            borderColor: headerBorder,
            boxShadow: isDark ? "0 -8px 32px rgba(0,0,0,0.5)" : "0 -4px 20px rgba(27,45,107,0.06)"
          }}>
          {navItems.slice(0, 4).map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <span className="flex flex-col items-center gap-1.5 cursor-pointer px-3.5 py-1.5 relative transition-all active:scale-95">
                  {isActive && (
                    <motion.div layoutId="mobile-active-top-nav"
                      className="absolute -inset-1.5 rounded-2xl pointer-events-none"
                      style={{ background: `${item.accent}0e`, border: `1px solid ${item.accent}20` }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                  )}
                  <div className={`p-1 rounded-lg relative z-10 transition-all ${isActive ? "scale-110" : ""}`}
                    style={isActive ? { color: item.accent } : { color: isDark ? "#64748b" : "#94A3B8" }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black tracking-tight relative z-10 transition-colors uppercase"
                    style={isActive ? { color: item.accent } : { color: isDark ? "#64748b" : "#94A3B8" }}>
                    {item.label.length > 8 ? item.label.split(" ")[0] : item.label}
                  </span>
                </span>
              </Link>
            );
          })}
          
          {/* More button */}
          <button onClick={() => setShowMoreMenu(true)}
            className="flex flex-col items-center gap-1.5 cursor-pointer px-3.5 py-1.5 relative transition-all active:scale-95"
          >
            <div className="p-1 rounded-lg relative z-10 transition-all text-[#94A3B8] dark:text-[#64748b]">
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black tracking-tight relative z-10 text-[#94A3B8] dark:text-[#64748b] uppercase">
              More
            </span>
          </button>
        </nav>
      </main>
    </div>
  );
}
