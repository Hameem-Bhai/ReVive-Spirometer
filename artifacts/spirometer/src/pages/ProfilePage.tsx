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
    if (!("Notification" in window)) {
      setNotifStatus("unsupported");
    } else if (Notification.permission === "granted") {
      setNotifStatus("granted");
    } else if (Notification.permission === "denied") {
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
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw background gradient
    const grad = ctx.createLinearGradient(0, 0, 600, 360);
    grad.addColorStop(0, "#9f1239"); // rose-800
    grad.addColorStop(1, "#1e1b4b"); // indigo-950
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 360);

    // Draw card border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 580, 340);

    // Draw Badge Background
    ctx.fillStyle = "rgba(244, 63, 94, 0.2)";
    ctx.beginPath();
    ctx.roundRect(30, 25, 140, 20, 10);
    ctx.fill();

    // Badge Text
    ctx.fillStyle = "#fecdd3";
    ctx.font = "bold 9px monospace";
    ctx.fillText("EMERGENCY MEDICAL PASS", 40, 38);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("REVIVE SPIROMETRY", 185, 38);

    // Patient Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(profile.name || "Anonymous Patient", 30, 80);

    // Age / Sex / City
    ctx.fillStyle = "#fecdd3";
    ctx.font = "12px sans-serif";
    ctx.fillText(`Age: ${profile.age || "N/A"}  |  Sex: ${profile.sex || "N/A"}  |  City: ${profile.city || "N/A"}`, 30, 105);

    // Emergency Contact section
    ctx.fillStyle = "#fecdd3";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText("EMERGENCY CONTACT", 30, 145);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(profile.emergencyName || "No contact set", 30, 165);

    ctx.fillStyle = "#fecdd3";
    ctx.font = "11px monospace";
    ctx.fillText(profile.emergencyPhone || "—", 30, 182);

    // Last PFT Baseline
    const history = loadHistory();
    const lastRecord = history[0];
    const ratioText = lastRecord ? `${lastRecord.ratio.toFixed(1)}%` : "N/A";
    const dateText = lastRecord ? new Date(lastRecord.date).toLocaleDateString() : "No test run";
    const statusText = lastRecord ? lastRecord.status.toUpperCase() : "N/A";

    ctx.fillStyle = "#fecdd3";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText(`LAST PFT BASELINE (${dateText})`, 30, 215);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("FEV1/FVC Ratio", 30, 235);

    ctx.fillStyle = lastRecord?.status === 'red' ? '#fda4af' : lastRecord?.status === 'yellow' ? '#fde047' : '#6ee7b7';
    ctx.font = "bold 18px monospace";
    ctx.fillText(ratioText, 30, 255);

    // Action plan text block
    const actionPlan = lastRecord?.status === "red"
      ? "RED ZONE: Severe obstruction. Use rescue inhaler. Seek immediate emergency help."
      : lastRecord?.status === "yellow"
      ? "YELLOW ZONE: Mild/moderate obstruction. Assist with reliever inhaler. Monitor symptoms."
      : "GREEN ZONE: Lung function stable. Maintain standard maintenance inhaler routines.";

    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(30, 275, 360, 55);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.strokeRect(30, 275, 360, 55);

    ctx.fillStyle = "#fecdd3";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("EMERGENCY ACTION PLAN", 38, 290);

    ctx.fillStyle = "#ffffff";
    ctx.font = "10px sans-serif";
    // Word wrap action plan
    const words = actionPlan.split(" ");
    let line = "";
    let y = 305;
    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + " ";
      let metrics = ctx.measureText(testLine);
      if (metrics.width > 340 && n > 0) {
        ctx.fillText(line, 38, y);
        line = words[n] + " ";
        y += 14;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 38, y);

    // Load and draw the QR Code image
    const qrPayload = `RE-VIVE RESPIRATORY PASSPORT\nName: ${profile.name || "Anonymous"}\nAge: ${profile.age}\nSex: ${profile.sex}\nEmergency Contact: ${profile.emergencyName} (${profile.emergencyPhone})\nLast PFT: ${ratioText} (${dateText})\nStatus: ${statusText}\nPlan: ${actionPlan}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPayload)}`;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = qrCodeUrl;
    img.onload = () => {
      // Draw white background for QR
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(430, 95, 140, 140, 16);
      ctx.fill();

      // Draw QR image
      ctx.drawImage(img, 440, 105, 120, 120);

      // Draw label
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "bold 8px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SCAN FOR MEDICAL INFO", 500, 255);

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
    <div className="p-5 md:p-8 max-w-3xl mx-auto w-full flex flex-col gap-7 text-[#1B2D6B]">
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
        <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[#1B2D6B]">Your Profile</h1>
        <p className="text-sm mt-1.5 text-[#64748B]">Saved locally on your device — never sent to any server.</p>
      </motion.div>

      {/* ── Profile Info ─────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}
        className="p-6 rounded-[1.5rem] flex flex-col gap-5 glass-card glass-card-hover"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#2563EB]/5 border border-[#2563EB]/10">
            <User className="w-4 h-4 text-[#2563EB]" />
          </div>
          <h2 className="font-display font-bold text-[#1B2D6B] text-lg">Personal Info</h2>
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
                    background: "rgba(37,99,235,0.08)",
                    borderColor: "rgba(37,99,235,0.2)",
                    color: "#2563EB"
                  } : {
                    background: "rgba(27,45,107,0.025)",
                    borderColor: "rgba(27,45,107,0.08)",
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
            background: "rgba(5,150,105,0.08)",
            border: "1px solid rgba(5,150,105,0.2)",
            color: "#059669"
          } : {
            background: "linear-gradient(135deg, #1B2D6B, #2563EB)",
            border: "none",
            color: "white",
            boxShadow: "0 4px 20px rgba(27,45,107,0.35), 0 2px 8px rgba(37,99,235,0.2)"
          }}
        >
          {saved ? <><CheckCircle className="w-4 h-4" /> Profile Saved!</> : <><Save className="w-4 h-4" /> Save Profile</>}
        </button>
      </motion.div>

      {/* ── Test Reminders ───────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.16 }}
        className="p-6 rounded-[1.5rem] flex flex-col gap-5 glass-card glass-card-hover"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#2563EB]/5 border border-[#2563EB]/10">
            <Bell className="w-4 h-4 text-[#2563EB]" />
          </div>
          <h2 className="font-display font-bold text-[#1B2D6B] text-lg">Test Reminders</h2>
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
                      background: "rgba(37,99,235,0.08)",
                      borderColor: "rgba(37,99,235,0.2)",
                      color: "#2563EB"
                    } : {
                      background: "rgba(27,45,107,0.025)",
                      borderColor: "rgba(27,45,107,0.08)",
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
                background: "rgba(5,150,105,0.08)",
                border: "1px solid rgba(5,150,105,0.2)",
                color: "#059669"
              } : {
                background: "rgba(37,99,235,0.08)",
                border: "1px solid rgba(37,99,235,0.15)",
                color: "#2563EB"
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
        className="p-6 rounded-[1.5rem] flex flex-col gap-4 glass-card glass-card-hover"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#059669]/5 border border-[#059669]/10">
            <Activity className="w-4 h-4 text-[#059669]" />
          </div>
          <h2 className="font-display font-bold text-[#1B2D6B] text-lg">Test History</h2>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div>
            <p className="text-sm font-bold text-[#1B2D6B]">{historyCount} test{historyCount !== 1 ? "s" : ""} stored</p>
            <p className="text-xs mt-0.5 text-[#64748B]">Stored locally on this device</p>
          </div>
          <button onClick={handleClearHistory}
            disabled={historyCount === 0}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold cursor-pointer transition-all border disabled:opacity-30 disabled:cursor-not-allowed"
            style={cleared ? {
              background: "rgba(5,150,105,0.08)",
              border: "1px solid rgba(5,150,105,0.2)",
              color: "#059669"
            } : {
              background: "rgba(220,38,38,0.08)",
              border: "1px solid rgba(220,38,38,0.15)",
              color: "#DC2626"
            }}
          >
            {cleared ? <><CheckCircle className="w-3.5 h-3.5" /> Cleared!</> : <><Trash2 className="w-3.5 h-3.5" /> Clear History</>}
          </button>
        </div>

        {/* Data privacy note */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#2563EB]/5 border border-[#2563EB]/10">
          <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#2563EB]" />
          <p className="text-xs leading-relaxed text-[#1B2D6B]">
            All data (profile, test records) is stored <strong className="text-[#2563EB]">only in your browser's localStorage</strong>. Nothing is sent to external servers. Clearing browser data will erase your history.
          </p>
        </div>
      </motion.div>

      {/* ── Emergency Respiratory Passport ───────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.32 }}
        className="p-6 rounded-[1.5rem] flex flex-col gap-6 glass-card glass-card-hover print:p-0 print:border-none print:shadow-none"
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
            <h2 className="font-display font-bold text-[#1B2D6B] text-lg">Emergency Medical Pass</h2>
            <p className="text-xs text-[#64748B]">Scanable QR passport for emergency responders</p>
          </div>
        </div>

        {/* The Passport Card itself */}
        <div className="rounded-3xl p-6 text-white relative overflow-hidden flex flex-col sm:flex-row gap-6 shadow-xl border border-rose-950/20 print:border print:text-black print:bg-white print:shadow-none print:rounded-none"
          style={{
            background: "linear-gradient(135deg, #9f1239 0%, #1e1b4b 100%)",
            boxShadow: "0 10px 30px -5px rgba(159,18,57,0.3)"
          }}
          id="emergency-pass-card"
        >
          {/* Left Details Panel */}
          <div className="flex-1 flex flex-col justify-between gap-4 text-left">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 print:text-rose-700 print:bg-rose-50 print:border-rose-200">
                  Emergency Medical Pass
                </span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest print:text-slate-600">ReVive Spirometry</span>
              </div>
              <h3 className="text-xl font-display font-black tracking-tight">{profile.name || "Anonymous Patient"}</h3>
              <p className="text-xs text-rose-200 mt-1 print:text-slate-600">
                Age: {profile.age || "N/A"} • Sex: {profile.sex || "N/A"} • City: {profile.city || "N/A"}
              </p>
            </div>

            <div className="border-t border-white/10 pt-3 print:border-slate-200">
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-300 block mb-1 print:text-slate-500">Emergency Contacts</span>
              <p className="text-xs font-bold leading-tight">{profile.emergencyName || "No contact set"}</p>
              <p className="text-[11px] text-rose-200 font-mono mt-0.5 print:text-slate-600">{profile.emergencyPhone || "—"}</p>
            </div>

            {(() => {
              const history = loadHistory();
              const lastRecord = history[0];
              const ratioText = lastRecord ? `${lastRecord.ratio.toFixed(1)}%` : "N/A";
              const dateText = lastRecord ? new Date(lastRecord.date).toLocaleDateString() : "No test run";
              const statusText = lastRecord ? lastRecord.status.toUpperCase() : "N/A";
              
              const actionPlan = lastRecord?.status === "red"
                ? "RED ZONE: Patient has severe airway obstruction. Administer rescue inhaler. Seek immediate emergency help."
                : lastRecord?.status === "yellow"
                ? "YELLOW ZONE: Mild/moderate obstruction. Assist with reliever inhaler. Monitor symptoms closely."
                : "GREEN ZONE: Lung function stable. Maintain standard maintenance inhaler routines.";

              // Data payload for QR code scan
              const qrPayload = `RE-VIVE RESPIRATORY PASSPORT\nName: ${profile.name || "Anonymous"}\nAge: ${profile.age}\nSex: ${profile.sex}\nEmergency Contact: ${profile.emergencyName} (${profile.emergencyPhone})\nLast PFT: ${ratioText} (${dateText})\nStatus: ${statusText}\nPlan: ${actionPlan}`;
              const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPayload)}`;

              return (
                <>
                  <div className="border-t border-white/10 pt-3 print:border-slate-200">
                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-300 block mb-1 print:text-slate-500">Last PFT Baseline ({dateText})</span>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-xs font-black">FEV₁/FVC Ratio</p>
                        <p className="text-lg font-mono font-black" style={{ color: lastRecord?.status === 'red' ? '#fda4af' : lastRecord?.status === 'yellow' ? '#fde047' : '#6ee7b7' }}>{ratioText}</p>
                      </div>
                      <div className="border-l border-white/10 pl-3 h-8 print:border-slate-200" />
                      <div>
                        <p className="text-xs font-black">Status Alert</p>
                        <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                          lastRecord?.status === 'red' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : lastRecord?.status === 'yellow' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>{statusText}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action plan guidance */}
                  <div className="p-3 rounded-xl text-[11px] leading-relaxed border border-white/10"
                    style={{ background: "rgba(255,255,255,0.05)" }}>
                    <span className="font-black text-rose-300 uppercase tracking-widest block mb-0.5">Emergency Action Plan</span>
                    {actionPlan}
                  </div>

                  {/* Right QR Panel */}
                  <div className="flex flex-col items-center justify-center shrink-0 gap-2 min-w-[140px] border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6 print:border-slate-200">
                    <div className="p-2 bg-white rounded-2xl shadow-lg shadow-black/20 flex items-center justify-center">
                      <img
                        src={qrCodeUrl}
                        alt="Emergency QR Passport"
                        className="w-28 h-28 object-contain print:w-24 print:h-24"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://placehold.co/150x150/ffffff/000000/png?text=QR+Offline";
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 text-center leading-none mt-1 print:text-slate-600">Scan for Medical Info</span>
                  </div>
                </>
              );
            })()}

          </div>
        </div>

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
            style={{ background: "linear-gradient(135deg, #1B2D6B, #2563EB)", boxShadow: "0 4px 16px rgba(27,45,107,0.25)" }}
          >
            <Share2 className="w-4 h-4" /> Download Pocket Pass (PNG)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
