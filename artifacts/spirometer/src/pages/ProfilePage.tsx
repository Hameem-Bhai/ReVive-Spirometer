/**
 * ProfilePage.tsx — User Profile, Reminders & Settings
 */
import React from "react";
import { motion } from "framer-motion";
import { 
  User, Save, Bell, BellOff, CheckCircle, 
  Trash2, MapPin, Calendar, Activity, AlertCircle
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
        whileHover={{ y: -3 }}
        className="p-6 rounded-[1.5rem] flex flex-col gap-5 bg-white"
        style={{ border: "1px solid rgba(27,45,107,0.07)", boxShadow: "0 2px 4px rgba(27,45,107,0.04), 0 8px 32px rgba(27,45,107,0.07), 0 24px 64px rgba(27,45,107,0.04)" }}
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
        whileHover={{ y: -3 }}
        className="p-6 rounded-[1.5rem] flex flex-col gap-5 bg-white"
        style={{ border: "1px solid rgba(27,45,107,0.07)", boxShadow: "0 2px 4px rgba(27,45,107,0.04), 0 8px 32px rgba(27,45,107,0.07), 0 24px 64px rgba(27,45,107,0.04)" }}
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
        whileHover={{ y: -3 }}
        className="p-6 rounded-[1.5rem] flex flex-col gap-4 bg-white"
        style={{ border: "1px solid rgba(27,45,107,0.07)", boxShadow: "0 2px 4px rgba(27,45,107,0.04), 0 8px 32px rgba(27,45,107,0.07), 0 24px 64px rgba(27,45,107,0.04)" }}
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
    </div>
  );
}
