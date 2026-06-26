/**
 * storage.ts — localStorage helpers for ReVive app
 * Handles: user profile, test history, reminder settings
 */

// ─── Types ────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  age: string;
  sex: string;
  city: string;
  remindersEnabled: boolean;
  reminderFrequency: "daily" | "every3days" | "weekly";
}

export interface TestRecord {
  id: string;
  date: string;          // ISO string
  fev1: number;          // Liters
  fvc: number;           // Liters
  ratio: number;         // percentage (e.g. 75.5)
  peakPressure: number;
  rounds: number;
  status: "green" | "yellow" | "red";
  notes?: string;
  isSimulated: boolean;
}

export interface ReminderSettings {
  enabled: boolean;
  frequency: "daily" | "every3days" | "weekly";
  lastNotified?: string; // ISO string
}

// ─── Keys ─────────────────────────────────────────────────

const KEYS = {
  PROFILE: "revive_profile",
  HISTORY: "revive_test_history",
  REMINDER: "revive_reminders",
} as const;

// ─── Profile ──────────────────────────────────────────────

export const DEFAULT_PROFILE: UserProfile = {
  name: "",
  age: "",
  sex: "",
  city: "",
  remindersEnabled: false,
  reminderFrequency: "weekly",
};

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(KEYS.PROFILE);
    if (!raw) return { ...DEFAULT_PROFILE };
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

// ─── Test History ─────────────────────────────────────────

export function loadHistory(): TestRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    if (!raw) return [];
    return JSON.parse(raw) as TestRecord[];
  } catch {
    return [];
  }
}

export function saveTestRecord(record: TestRecord): void {
  const history = loadHistory();
  // prepend newest first
  history.unshift(record);
  // cap at 50 records
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(history.slice(0, 50)));
}

export function clearHistory(): void {
  localStorage.removeItem(KEYS.HISTORY);
}

/** Derive chart-friendly data from stored history */
export function getHistoryChartData(records: TestRecord[]) {
  return [...records]
    .reverse()
    .slice(-14) // last 14 entries
    .map((r) => ({
      date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      fev1: r.fev1,
      fvc: r.fvc,
      ratio: r.ratio,
    }));
}

/** Compute averages from history */
export function getHistoryStats(records: TestRecord[]) {
  if (records.length === 0) return null;
  const avgFev1 = records.reduce((s, r) => s + r.fev1, 0) / records.length;
  const avgFvc  = records.reduce((s, r) => s + r.fvc,  0) / records.length;
  const avgRatio = records.reduce((s, r) => s + r.ratio, 0) / records.length;
  const best    = records.reduce((a, b) => (b.fev1 > a.fev1 ? b : a));
  return {
    avgFev1: +avgFev1.toFixed(2),
    avgFvc:  +avgFvc.toFixed(2),
    avgRatio: +avgRatio.toFixed(1),
    bestFev1: best.fev1,
    totalTests: records.length,
  };
}

/** Classify ratio into status */
export function classifyRatio(ratio: number): "green" | "yellow" | "red" {
  if (ratio >= 70) return "green";
  if (ratio >= 60) return "yellow";
  return "red";
}

// ─── Reminders ────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function scheduleTestReminder(frequency: "daily" | "every3days" | "weekly"): void {
  const intervalMs: Record<string, number> = {
    daily: 24 * 60 * 60 * 1000,
    every3days: 3 * 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
  };
  const ms = intervalMs[frequency] ?? intervalMs.weekly;
  // Store the next-fire time
  const next = new Date(Date.now() + ms).toISOString();
  localStorage.setItem("revive_next_reminder", next);
}

export function checkAndFireReminder(): void {
  if (Notification.permission !== "granted") return;
  const nextStr = localStorage.getItem("revive_next_reminder");
  if (!nextStr) return;
  if (new Date() >= new Date(nextStr)) {
    new Notification("ReVive — Time to run your spirometry test 🫁", {
      body: "Track your lung health by running a quick spirometry check today.",
      icon: "/favicon.svg",
    });
    // Remove so it only fires once per visit
    localStorage.removeItem("revive_next_reminder");
  }
}
