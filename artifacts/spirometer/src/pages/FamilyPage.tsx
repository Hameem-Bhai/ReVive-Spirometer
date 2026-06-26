/**
 * FamilyPage.tsx — Multi-profile family mode
 * Up to 5 local profiles with separate history namespaces
 */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Trash2, Check, Edit2, X, ChevronRight } from "lucide-react";

interface FamilyProfile {
  id: string;
  name: string;
  age: string;
  colorIndex: number;
}

const AVATAR_COLORS = [
  { bg: "#1B2D6B", text: "#ffffff" },
  { bg: "#059669", text: "#ffffff" },
  { bg: "#D97706", text: "#ffffff" },
  { bg: "#7c3aed", text: "#ffffff" },
  { bg: "#e11d48", text: "#ffffff" },
];

const STORAGE_KEY = "revive_family_profiles";
const ACTIVE_KEY  = "revive_active_profile";

function loadProfiles(): FamilyProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

function saveProfiles(profiles: FamilyProfile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function getActiveProfileId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function getHistoryKey(profileId: string | null): string {
  return profileId ? `revive_test_history_${profileId}` : "revive_test_history";
}

export default function FamilyPage() {
  const [profiles, setProfiles] = React.useState<FamilyProfile[]>(loadProfiles);
  const [activeId, setActiveId] = React.useState<string | null>(() => localStorage.getItem(ACTIVE_KEY));
  const [adding, setAdding] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newAge, setNewAge] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const switchProfile = (id: string | null) => {
    localStorage.setItem(ACTIVE_KEY, id || "");
    setActiveId(id);
    // Reload page so all hooks re-read the new profile's data
    window.location.reload();
  };

  const addProfile = () => {
    if (!newName.trim()) return;
    const profile: FamilyProfile = {
      id: Math.random().toString(36).slice(2),
      name: newName.trim(),
      age: newAge,
      colorIndex: profiles.length % AVATAR_COLORS.length,
    };
    const updated = [...profiles, profile];
    setProfiles(updated);
    saveProfiles(updated);
    setNewName("");
    setNewAge("");
    setAdding(false);
  };

  const removeProfile = (id: string) => {
    const updated = profiles.filter(p => p.id !== id);
    setProfiles(updated);
    saveProfiles(updated);
    // Also clear their history
    localStorage.removeItem(`revive_test_history_${id}`);
    if (activeId === id) switchProfile(null);
  };

  const initials = (name: string) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="p-5 md:p-8 max-w-2xl mx-auto w-full flex flex-col gap-7">
      {/* Decorative glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #1B2D6B, transparent)", filter: "blur(80px)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em] mb-2"
          style={{ color: "#be185d", background: "rgba(190,24,93,0.07)", border: "1px solid rgba(190,24,93,0.15)", boxShadow: "0 2px 8px rgba(190,24,93,0.08)" }}>
          <Users className="w-2.5 h-2.5" /> Family Mode
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "#0F172A" }}>Profiles</h1>
        <p className="text-sm mt-1.5" style={{ color: "#64748B" }}>Up to 5 members can track their lung health independently on this device.</p>
      </motion.div>

      {/* Default / Personal profile */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        whileHover={{ y: -3 }}>
        <p className="text-[10px] font-black uppercase tracking-[0.15em] mb-3" style={{ color: "#94A3B8" }}>Current Device Profile</p>
        <button
          onClick={() => switchProfile(null)}
          className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer text-left"
          style={{
            background: !activeId ? "linear-gradient(135deg, rgba(27,45,107,0.07), rgba(59,130,246,0.04))" : "#FFFFFF",
            border: !activeId ? "2px solid rgba(27,45,107,0.22)" : "1px solid rgba(27,45,107,0.07)",
            boxShadow: !activeId 
              ? "0 4px 8px rgba(27,45,107,0.06), 0 16px 40px rgba(27,45,107,0.12)"
              : "0 2px 4px rgba(27,45,107,0.03), 0 8px 24px rgba(27,45,107,0.06)"
          }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black text-white"
            style={{ background: "linear-gradient(135deg, #1B2D6B, #3B82F6)" }}>
            Me
          </div>
          <div className="flex-1">
            <h3 className="font-black text-base" style={{ color: "#0F172A" }}>Personal (Default)</h3>
            <p className="text-xs" style={{ color: "#64748B" }}>Shared device profile — no name</p>
          </div>
          {!activeId && <Check className="w-5 h-5" style={{ color: "#059669" }} />}
        </button>
      </motion.div>

      {/* Family profiles */}
      {profiles.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] mb-3" style={{ color: "#94A3B8" }}>Family Members ({profiles.length}/5)</p>
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {profiles.map((profile, idx) => {
                const colors = AVATAR_COLORS[profile.colorIndex] || AVATAR_COLORS[0];
                const isActive = activeId === profile.id;
                return (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12, height: 0 }}
                    whileHover={{ y: -3 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-center gap-4 p-4 rounded-2xl transition-all"
                    style={isActive ? {
                      background: `linear-gradient(135deg, ${colors.bg}10, ${colors.bg}06)`,
                      border: `2px solid ${colors.bg}30`,
                      boxShadow: `0 4px 20px ${colors.bg}12`
                    } : {
                      background: "#FFFFFF",
                      border: "1px solid rgba(27,45,107,0.08)",
                      boxShadow: "0 2px 12px rgba(27,45,107,0.04)"
                    }}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black"
                      style={{ background: colors.bg, color: colors.text }}>
                      {initials(profile.name)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-base" style={{ color: "#0F172A" }}>{profile.name}</h3>
                      <p className="text-xs" style={{ color: "#64748B" }}>{profile.age ? `${profile.age} years old` : "Age not set"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive && <Check className="w-5 h-5" style={{ color: "#059669" }} />}
                      {!isActive && (
                        <button onClick={() => switchProfile(profile.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-all"
                          style={{ background: "rgba(27,45,107,0.06)", color: "#1B2D6B", border: "1px solid rgba(27,45,107,0.12)" }}>
                          Switch
                        </button>
                      )}
                      <button onClick={() => removeProfile(profile.id)}
                        className="p-1.5 rounded-lg cursor-pointer transition-all"
                        style={{ color: "#94A3B8" }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8"}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Add profile */}
      {profiles.length < 5 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <AnimatePresence mode="wait">
            {!adding ? (
              <motion.button key="add-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setAdding(true)}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm cursor-pointer transition-all"
                style={{ background: "#FFFFFF", border: "2px dashed rgba(27,45,107,0.15)", color: "#1B2D6B" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(27,45,107,0.04)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(27,45,107,0.3)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(27,45,107,0.15)"; }}>
                <Plus className="w-4 h-4" /> Add Family Member
              </motion.button>
            ) : (
              <motion.div key="add-form" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="p-5 rounded-2xl flex flex-col gap-4"
                style={{ background: "#FFFFFF", border: "1px solid rgba(27,45,107,0.12)", boxShadow: "0 8px 30px rgba(27,45,107,0.08)" }}>
                <h3 className="font-black text-base" style={{ color: "#0F172A" }}>New Family Member</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "#64748B" }}>Name *</label>
                    <input type="text" placeholder="e.g. Sarah" value={newName} onChange={e => setNewName(e.target.value)}
                      autoFocus
                      className="px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
                      style={{ background: "rgba(27,45,107,0.03)", border: "1px solid rgba(27,45,107,0.12)", color: "#0F172A" }}
                      onFocus={e => (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(27,45,107,0.35)"}
                      onBlur={e => (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(27,45,107,0.12)"} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "#64748B" }}>Age</label>
                    <input type="number" placeholder="e.g. 45" value={newAge} onChange={e => setNewAge(e.target.value)}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
                      style={{ background: "rgba(27,45,107,0.03)", border: "1px solid rgba(27,45,107,0.12)", color: "#0F172A" }}
                      onFocus={e => (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(27,45,107,0.35)"}
                      onBlur={e => (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(27,45,107,0.12)"} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={addProfile} disabled={!newName.trim()}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white cursor-pointer transition-all disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #1B2D6B, #2563EB)", boxShadow: "0 4px 16px rgba(27,45,107,0.3)" }}>
                    Add Profile
                  </button>
                  <button onClick={() => { setAdding(false); setNewName(""); setNewAge(""); }}
                    className="px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all"
                    style={{ background: "rgba(27,45,107,0.05)", color: "#64748B" }}>
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Info */}
      <div className="p-4 rounded-2xl" style={{ background: "rgba(27,45,107,0.04)", border: "1px solid rgba(27,45,107,0.08)" }}>
        <p className="text-xs leading-relaxed" style={{ color: "#64748B" }}>
          <strong style={{ color: "#1B2D6B" }}>Privacy:</strong> All profiles are stored only in this browser's local storage. Switching profiles separates test history, streaks, and stats completely. No data is shared between profiles or uploaded to any server.
        </p>
      </div>
    </div>
  );
}
