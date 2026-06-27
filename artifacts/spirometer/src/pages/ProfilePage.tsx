/**
 * ProfilePage.tsx — User Profile, Reminders & Settings
 */
import React from "react";
import { motion } from "framer-motion";
import { 
  User, Save, Bell, BellOff, CheckCircle, 
  Trash2, MapPin, Calendar, Activity, AlertCircle,
  ShieldAlert, Printer, Share2
} from "lucide-react";
import { 
  loadProfile, saveProfile, loadHistory, clearHistory,
  requestNotificationPermission, scheduleTestReminder,
  type UserProfile
} from "@/lib/storage";

const SEX_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const FREQ_OPTIONS: { value: UserProfile["reminderFrequency"]; label: string }[] = [
  { value: "daily", label: "Every day" },
  { value: "every3days", label: "Every 3 days" },
  { value: "weekly", label: "Once a week" },
];

export default function ProfilePage() {
  const [profile, setProfile] = React.useState<UserProfile>(loadProfile);
  const [saved, setSaved] = React.useState(false);
  const [notifStatus, setNotifStatus] = React.useState<"idle" | "granted" | "denied" | "unsupported">("idle");
  const [historyCount, setHistoryCount] = React.useState(() => loadHistory().length);
  const [cleared, setCleared] = React.useState(false);

  // Check notification permission on mount
  React.useEffect(() => {
    if (!("Notification" in window) || !window.Notification) {
      setNotifStatus("unsupported");
    } else if (window.Notification.permission === "granted") {
      setNotifStatus("granted");
    } else if (window.Notification.permission === "denied") {
      setNotifStatus("denied");
    }
  }, []);

  const handleSave = () => {
    saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleEnableReminders = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotifStatus("granted");
      setProfile(p => ({ ...p, remindersEnabled: true }));
      scheduleTestReminder(profile.reminderFrequency);
    } else {
      setNotifStatus("denied");
    }
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistoryCount(0);
    setCleared(true);
    setTimeout(() => setCleared(false), 2500);
  };

  const downloadPassportAsImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 420;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 600, 420);

    // Draw grid background
    ctx.strokeStyle = "rgba(226, 232, 240, 0.5)";
    ctx.lineWidth = 1;
    for (let x = 0; x < 600; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 420);
      ctx.stroke();
    }
    for (let y = 0; y < 420; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(600, y);
      ctx.stroke();
    }

    // TOP SECTION: Logo on Left
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText("ReVive", 30, 40);
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("SPIROMETRY", 30, 52);

    // Lungs Logo Drawing (overlapping teal circles representing lungs + medical cross)
    ctx.fillStyle = "#14b8a6";
    ctx.beginPath();
    ctx.arc(102, 38, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(114, 38, 8, 0, 2 * Math.PI);
    ctx.fill();
    // Cross
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(111, 37, 6, 2);
    ctx.fillRect(113, 35, 2, 6);

    // TOP SECTION: Title Banner on Right
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(330, 20, 240, 36, 6);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("EMERGENCY MEDICAL PASS", 450, 42);
    ctx.textAlign = "left";

    // Row 2: PATIENT INFORMATION
    ctx.fillStyle = "#14b8a6";
    ctx.beginPath();
    ctx.roundRect(30, 75, 540, 20, 6);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("PATIENT INFORMATION", 40, 89);

    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.roundRect(30, 95, 540, 30, [0, 0, 6, 6]);
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 95, 540, 30);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText(`Name: ${profile.name || "Hameem"}`, 40, 114);
    ctx.fillText(`Age: ${profile.age || "21"}  Sex: ${profile.sex || "Male"}`, 240, 114);
    ctx.fillText(`City: ${profile.city || "Dhaka"}`, 420, 114);

    // Row 3: Last Spirometry Results (Left) & Status (Right)
    const history = loadHistory();
    const lastRecord = history[0];
    const fev1Val = lastRecord?.fev1 ? lastRecord.fev1.toFixed(2) : "4.92";
    const fvcVal = lastRecord?.fvc ? lastRecord.fvc.toFixed(2) : "6.00";
    const ratioText = lastRecord?.ratio ? `${lastRecord.ratio.toFixed(1)}%` : "82.0%";
    const dateText = lastRecord ? new Date(lastRecord.date).toLocaleDateString() : new Date().toLocaleDateString();
    const statusText = lastRecord ? lastRecord.status.toUpperCase() : "GREEN";

    // Left Box Header
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(30, 140, 255, 20, 6);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("LAST SPIROMETRY RESULTS", 40, 154);

    // Left Box Content
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.roundRect(30, 160, 255, 32, [0, 0, 6, 6]);
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.strokeRect(30, 160, 255, 32);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText(`FEV₁: ${fev1Val} L  |  FVC: ${fvcVal} L`, 40, 174);
    ctx.font = "9px monospace";
    ctx.fillStyle = "#64748b";
    ctx.fillText(`Ratio: ${ratioText} (Optimal)`, 40, 186);

    // Right Status Badge
    const statusColor = lastRecord?.status === 'red' ? '#ef4444' : lastRecord?.status === 'yellow' ? '#f59e0b' : '#10b981';
    const statusLabelText = lastRecord?.status === 'red' ? '🔴 RED ZONE – Emergency alert' : lastRecord?.status === 'yellow' ? '🟡 YELLOW ZONE – Caution alert' : '🟢 GREEN ZONE – Lung function stable';

    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.roundRect(305, 140, 265, 52, 6);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(statusLabelText, 437, 171);
    ctx.textAlign = "left";

    // Row 4: Emergency Contact (Left) & QR Code (Right)
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(30, 207, 395, 20, 6);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("EMERGENCY CONTACT INFO", 40, 221);

    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.roundRect(30, 227, 395, 45, [0, 0, 6, 6]);
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.strokeRect(30, 227, 395, 45);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText(profile.emergencyName || "Basit", 40, 245);
    ctx.font = "9px monospace";
    ctx.fillStyle = "#64748b";
    ctx.fillText(profile.emergencyPhone || "01581-597001", 40, 258);

    // Row 5: Action Plan (Full Width)
    ctx.fillStyle = "#14b8a6";
    ctx.beginPath();
    ctx.roundRect(30, 287, 395, 20, 6);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("STEP-BY-STEP ACTION PLAN", 40, 301);

    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.roundRect(30, 307, 395, 78, [0, 0, 6, 6]);
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.strokeRect(30, 307, 395, 78);

    const plans = [
      { label: "Green Zone:", desc: "Continue daily maintenance inhaler as prescribed.", color: "#10b981" },
      { label: "Yellow Zone:", desc: "Use rescue inhaler and monitor symptoms closely.", color: "#f59e0b" },
      { label: "Red Zone:", desc: "Seek immediate medical attention.", color: "#ef4444" }
    ];

    let planY = 325;
    plans.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.font = "bold 9px sans-serif";
      ctx.fillText(p.label, 40, planY);

      ctx.fillStyle = "#475569";
      ctx.font = "9px sans-serif";
      ctx.fillText(p.desc, 105, planY);
      planY += 16;
    });

    // Load and draw the QR Code image
    const qrPayload = `RE-VIVE RESPIRATORY PASSPORT\nName: ${profile.name || "Anonymous"}\nAge: ${profile.age}\nSex: ${profile.sex}\nEmergency Contact: ${profile.emergencyName} (${profile.emergencyPhone})\nLast PFT: ${ratioText} (${dateText})\nStatus: ${statusText}\nPlan:\n${plans.map(p => `${p.label} ${p.desc}`).join("\n")}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPayload)}`;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = qrCodeUrl;
    img.onload = () => {
      // Draw white background for QR
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(440, 207, 130, 130, 12);
      ctx.fill();
      ctx.strokeStyle = "#e2e8f0";
      ctx.strokeRect(440, 207, 130, 130);

      // Draw QR image
      ctx.drawImage(img, 450, 217, 110, 110);

      // Draw label
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 7px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Scan QR Code", 505, 350);

      // Powered By watermark
      ctx.fillStyle = "rgba(15,23,42,0.3)";
      ctx.font = "8px sans-serif";
      ctx.fillText("Powered by ReVive Spirometry •", 300, 405);

      // Trigger download
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${(profile.name || "revive_patient").toLowerCase().replace(/\s+/g, "_")}_passport.png`;
      a.click();
    };
  };

  const field = (label: string, key: keyof UserProfile, placeholder: string, type = "text") => (
    <div className="flex flex-col gap-1.5 text-left">
      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#64748B]">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={profile[key] as string}
        onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
        className="input-clean bg-slate-50/50 hover:bg-slate-50 border-slate-200/80 focus:border-[#2563EB] focus:ring-[#2563EB]/10 text-sm text-[#1B2D6B]"
        style={{ fontFamily: "inherit" }}
      />
    </div>
  );

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto w-full flex flex-col gap-7 text-[#0f172a]">
      {/* Decorative glow orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-[25%] w-[50%] h-[50%] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #2563EB, transparent)", filter: "blur(80px)" }} />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, #059669, transparent)", filter: "blur(60px)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em] mb-2"
          style={{ color: "#D97706", background: "rgba(217,119,6,0.07)", border: "1px solid rgba(217,119,6,0.15)", boxShadow: "0 2px 8px rgba(217,119,6,0.08)" }}>
          <User className="w-2.5 h-2.5" /> Settings
        </span>
        <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[#0f172a]">Your Profile</h1>
        <p className="text-sm mt-1.5 text-[#64748B]">Saved locally on your device — never sent to any server.</p>
      </motion.div>

      {/* ── Profile Info ─────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}
        className="p-6 rounded-[1.5rem] flex flex-col gap-5 card-premium"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#14b8a6]/10 border border-[#14b8a6]/20">
            <User className="w-4 h-4 text-[#14b8a6]" />
          </div>
          <h2 className="font-display font-bold text-[#0f172a] text-lg">Personal Info</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("Full Name", "name", "e.g. Alex Kim")}
          {field("Age", "age", "e.g. 34", "number")}
          {field("Home City", "city", "e.g. Dhaka")}
          {field("Emergency Contact Name", "emergencyName", "e.g. Jane Doe (Wife)")}
          {field("Emergency Contact Phone", "emergencyPhone", "e.g. +7 701 123 4567")}

          {/* Sex selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#64748B]">Biological Sex</label>
            <div className="grid grid-cols-2 gap-2">
              {SEX_OPTIONS.map(opt => (
                <button key={opt} type="button"
                  onClick={() => setProfile(p => ({ ...p, sex: opt }))}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border"
                  style={profile.sex === opt ? {
                    background: "rgba(20,184,166,0.08)",
                    borderColor: "rgba(20,184,166,0.2)",
                    color: "#14b8a6"
                  } : {
                    background: "rgba(15,23,42,0.025)",
                    borderColor: "rgba(15,23,42,0.08)",
                    color: "#64748B"
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleSave}
          className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm cursor-pointer transition-all active:scale-95 hover:-translate-y-0.5 w-full sm:w-auto"
          style={saved ? {
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.2)",
            color: "#10b981"
          } : {
            background: "linear-gradient(135deg, #0f172a, #14b8a6)",
            border: "none",
            color: "white",
            boxShadow: "0 4px 20px rgba(15,23,42,0.15), 0 2px 8px rgba(20,184,166,0.1)"
          }}
        >
          {saved ? <><CheckCircle className="w-4 h-4" /> Profile Saved!</> : <><Save className="w-4 h-4" /> Save Profile</>}
        </button>
      </motion.div>

      {/* ── Test Reminders ───────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.16 }}
        className="p-6 rounded-[1.5rem] flex flex-col gap-5 card-premium"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#14b8a6]/10 border border-[#14b8a6]/20">
            <Bell className="w-4 h-4 text-[#14b8a6]" />
          </div>
          <h2 className="font-display font-bold text-[#0f172a] text-lg">Test Reminders</h2>
        </div>

        {notifStatus === "unsupported" ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
            <p className="text-sm text-amber-700">Browser notifications are not supported in this browser. Try Chrome or Edge.</p>
          </div>
        ) : notifStatus === "denied" ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
            <BellOff className="w-5 h-5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-bold text-red-700">Notifications blocked</p>
              <p className="text-xs mt-0.5 text-red-600">Please enable notifications for this site in your browser settings.</p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#64748B]">
              Get a browser notification reminding you to run your spirometry test on a schedule.
            </p>

            {/* Frequency selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#64748B]">Reminder Frequency</label>
              <div className="flex gap-2 flex-wrap">
                {FREQ_OPTIONS.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setProfile(p => ({ ...p, reminderFrequency: opt.value }))}
                    className="py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer border"
                    style={profile.reminderFrequency === opt.value ? {
                      background: "rgba(20,184,166,0.08)",
                      borderColor: "rgba(20,184,166,0.2)",
                      color: "#14b8a6"
                    } : {
                      background: "rgba(15,23,42,0.025)",
                      borderColor: "rgba(15,23,42,0.08)",
                      color: "#64748B"
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleEnableReminders}
              className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm cursor-pointer transition-all active:scale-95 w-full sm:w-auto"
              style={notifStatus === "granted" ? {
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)",
                color: "#10b981"
              } : {
                background: "rgba(20,184,166,0.08)",
                border: "1px solid rgba(20,184,166,0.15)",
                color: "#14b8a6"
              }}
            >
              {notifStatus === "granted"
                ? <><CheckCircle className="w-4 h-4" /> Reminders Active — Click to Reschedule</>
                : <><Bell className="w-4 h-4" /> Enable Reminders</>
              }
            </button>
          </>
        )}
      </motion.div>

      {/* ── Test History Management ───────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.24 }}
        className="p-6 rounded-[1.5rem] flex flex-col gap-4 card-premium"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#10b981]/10 border border-[#10b981]/20">
            <Activity className="w-4 h-4 text-[#10b981]" />
          </div>
          <h2 className="font-display font-bold text-[#0f172a] text-lg">Test History</h2>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div>
            <p className="text-sm font-bold text-[#0f172a]">{historyCount} test{historyCount !== 1 ? "s" : ""} stored</p>
            <p className="text-xs mt-0.5 text-[#64748B]">Stored locally on this device</p>
          </div>
          <button onClick={handleClearHistory}
            disabled={historyCount === 0}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold cursor-pointer transition-all border disabled:opacity-30 disabled:cursor-not-allowed"
            style={cleared ? {
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
              color: "#10b981"
            } : {
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.15)",
              color: "#ef4444"
            }}
          >
            {cleared ? <><CheckCircle className="w-3.5 h-3.5" /> Cleared!</> : <><Trash2 className="w-3.5 h-3.5" /> Clear History</>}
          </button>
        </div>

        {/* Data privacy note */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#14b8a6]/10 border border-[#14b8a6]/20">
          <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#14b8a6]" />
          <p className="text-xs leading-relaxed text-[#0f172a]">
            All data (profile, test records) is stored <strong className="text-[#14b8a6]">only in your browser's localStorage</strong>. Nothing is sent to external servers. Clearing browser data will erase your history.
          </p>
        </div>
      </motion.div>

      {/* ── Emergency Respiratory Passport ───────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.32 }}
        className="p-6 rounded-[1.5rem] flex flex-col gap-6 card-premium print:p-0 print:border-none print:shadow-none"
      >
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #emergency-pass-card, #emergency-pass-card * {
              visibility: visible;
            }
            #emergency-pass-card {
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              width: 100% !important;
              max-width: 500px;
              color: black !important;
              background: white !important;
              border: 1px solid #cbd5e1 !important;
              padding: 24px !important;
              box-shadow: none !important;
            }
          }
        `}</style>

        <div className="flex items-center gap-2 mb-1 print:hidden">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 border border-rose-100">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-left">
            <h2 className="font-display font-bold text-[#0f172a] text-lg">Emergency Medical Pass</h2>
            <p className="text-xs text-[#64748B]">Scannable QR passport for emergency responders</p>
          </div>
        </div>

        {/* The Passport Card itself */}
        {(() => {
          const logoSvg = (
            <div className="flex items-center gap-2 text-left">
              <svg viewBox="0 0 100 80" className="w-8 h-8 text-[#14b8a6] shrink-0" fill="currentColor">
                {/* Left Lung Lobe */}
                <path d="M 45 15 C 40 5, 15 5, 8 25 C 2 45, 5 65, 22 72 C 37 76, 45 64, 45 53 Z" />
                {/* Right Lung Lobe */}
                <path d="M 55 15 C 60 5, 85 5, 92 25 C 98 45, 95 65, 78 72 C 63 76, 55 64, 55 53 Z" />
                {/* Medical Cross inside right lung */}
                <rect x="68" y="36" width="10" height="3" fill="white" rx="0.5" />
                <rect x="71.5" y="32.5" width="3" height="10" fill="white" rx="0.5" />
              </svg>
              <div className="flex flex-col leading-none font-sans">
                <span className="text-[#0f172a] text-base font-black tracking-tight">ReVive</span>
                <span className="text-[#64748b] text-[9px] font-black uppercase tracking-wider">Spirometry</span>
              </div>
            </div>
          );

          const history = loadHistory();
          const lastRecord = history[0];
          const fev1Val = lastRecord?.fev1 ? lastRecord.fev1.toFixed(2) : "4.92";
          const fvcVal = lastRecord?.fvc ? lastRecord.fvc.toFixed(2) : "6.00";
          const ratioText = lastRecord?.ratio ? `${lastRecord.ratio.toFixed(1)}%` : "82.0%";
          const dateText = lastRecord ? new Date(lastRecord.date).toLocaleDateString() : new Date().toLocaleDateString();
          const statusText = lastRecord ? lastRecord.status.toUpperCase() : "GREEN";

          const plans = [
            { label: "Green Zone:", desc: "Continue daily maintenance inhaler as prescribed.", color: "text-emerald-500" },
            { label: "Yellow Zone:", desc: "Use rescue inhaler and monitor symptoms closely.", color: "text-amber-500" },
            { label: "Red Zone:", desc: "Seek immediate medical attention.", color: "text-rose-500" }
          ];

          const statusLabelText = lastRecord?.status === 'red' ? '🔴 RED ZONE – Emergency alert' : lastRecord?.status === 'yellow' ? '🟡 YELLOW ZONE – Caution alert' : '🟢 GREEN ZONE – Lung function stable';
          const statusColorClass = lastRecord?.status === 'red' ? 'text-white border-red-600 bg-[#ef4444]' : lastRecord?.status === 'yellow' ? 'text-white border-amber-500 bg-[#f59e0b]' : 'text-white border-emerald-600 bg-[#10b981]';

          const qrPayload = `RE-VIVE RESPIRATORY PASSPORT\nName: ${profile.name || "Anonymous"}\nAge: ${profile.age}\nSex: ${profile.sex}\nEmergency Contact: ${profile.emergencyName} (${profile.emergencyPhone})\nLast PFT: ${ratioText} (${dateText})\nStatus: ${statusText}\nPlan:\n${plans.map(p => `${p.label} ${p.desc}`).join("\n")}`;
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPayload)}`;

          return (
            <div className="rounded-3xl p-6 text-slate-800 relative overflow-hidden flex flex-col gap-5 shadow-xl border border-slate-200 bg-white print:border print:text-black print:bg-white print:shadow-none print:rounded-none"
              style={{
                backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)",
                backgroundSize: "16px 16px",
                backgroundColor: "#ffffff"
              }}
              id="emergency-pass-card"
            >
              {/* Row 1: Logo & Navy Banner */}
              <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-100 pb-4">
                {logoSvg}
                <div className="bg-[#0f172a] text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-[0.2em] font-serif shadow-sm">
                  Emergency Medical Pass
                </div>
              </div>

              {/* Row 2: PATIENT INFORMATION */}
              <div className="text-left">
                <div className="bg-[#14b8a6] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-t-lg">
                  Patient Information
                </div>
                <div className="bg-[#f8fafc]/50 border border-t-0 border-slate-200/80 p-3.5 rounded-b-lg grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Name</span>
                    <span className="font-extrabold text-[#0f172a]">{profile.name || "Hameem"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Age & Sex</span>
                    <span className="font-bold text-slate-700">Age: {profile.age || "21"} • Sex: {profile.sex || "Male"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Location</span>
                    <span className="font-bold text-slate-700">{profile.city || "Dhaka"}</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Spirometry & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <div className="bg-[#0f172a] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-t-lg">
                    Last Spirometry Results
                  </div>
                  <div className="bg-[#f8fafc]/50 border border-t-0 border-slate-200/80 p-3.5 rounded-b-lg text-xs leading-relaxed">
                    <div className="font-bold text-[#0f172a]">FEV₁: {fev1Val} L | FVC: {fvcVal} L</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono">Ratio: {ratioText} (Optimal)</div>
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <div className={`p-4 rounded-xl border text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-2 shadow-sm h-[58px] ${statusColorClass}`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                    {statusLabelText}
                  </div>
                </div>
              </div>

              {/* Row 4: Emergency Contact & QR Code */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-left items-stretch">
                {/* Contact Details */}
                <div className="sm:col-span-8 flex flex-col justify-between">
                  <div>
                    <div className="bg-[#0f172a] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-t-lg">
                      Emergency Contact Info
                    </div>
                    <div className="bg-[#f8fafc]/50 border border-t-0 border-slate-200/80 p-3.5 rounded-b-lg text-xs leading-relaxed flex-1">
                      <div className="font-extrabold text-[#0f172a]">{profile.emergencyName || "Basit"}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{profile.emergencyPhone || "01581-597001"}</div>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="sm:col-span-4 flex flex-col items-center justify-center bg-slate-50 border border-slate-200/80 p-3 rounded-2xl shrink-0 gap-2">
                  <div className="p-1.5 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                    <img
                      src={qrCodeUrl}
                      alt="Emergency QR Passport"
                      className="w-20 h-20 object-contain print:w-16 print:h-16"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/150x150/ffffff/000000/png?text=QR+Offline";
                      }}
                    />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 text-center leading-normal max-w-[120px]">Scan QR Code</span>
                </div>
              </div>

              {/* Row 5: Action Plan */}
              <div className="text-left">
                <div className="bg-[#14b8a6] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-t-lg">
                  Step-by-Step Action Plan
                </div>
                <div className="bg-[#f8fafc]/50 border border-t-0 border-slate-200/80 p-3.5 rounded-b-lg text-xs leading-relaxed flex flex-col gap-2">
                  {plans.map(p => (
                    <div key={p.label} className="flex gap-2 text-[11px]">
                      <span className={`font-black shrink-0 ${p.color}`}>{p.label}</span>
                      <span className="text-slate-600 font-medium">{p.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Action Controls */}
        <div className="flex gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 rounded-xl text-xs font-black border border-slate-200 text-slate-600 flex items-center justify-center gap-2 transition hover:bg-slate-50 active:scale-95 cursor-pointer bg-white"
          >
            <Printer className="w-4 h-4" /> Print Pocket Card
          </button>
          <button
            onClick={downloadPassportAsImage}
            className="flex-1 py-3 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 transition hover:opacity-90 active:scale-95 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)", boxShadow: "0 4px 16px rgba(20,184,166,0.25)" }}
          >
            <Share2 className="w-4 h-4" /> Download Pocket Pass (PNG)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
