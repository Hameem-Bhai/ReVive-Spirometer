/**
 * gamification.ts — Streaks, badges, personal bests
 */
import { loadHistory, type TestRecord } from "./storage";

// ─── Types ────────────────────────────────────────────────

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string; // CSS color
  unlocked: boolean;
  unlockedDate?: string;
}

export interface GamificationStats {
  currentStreak: number;
  longestStreak: number;
  totalTests: number;
  bestFev1: number;
  bestRatio: number;
  badges: Badge[];
  isNewPersonalBest: boolean;
  newPersonalBestType?: "fev1" | "ratio";
}

// ─── Streak Calculation ────────────────────────────────────

/** Count how many consecutive calendar days the user has tested (ending today or yesterday) */
export function calcStreak(records: TestRecord[]): { current: number; longest: number } {
  if (records.length === 0) return { current: 0, longest: 0 };

  // Get unique calendar dates (YYYY-MM-DD), sorted descending
  const dates = Array.from(
    new Set(records.map(r => r.date.slice(0, 10)))
  ).sort().reverse();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let current = 0;
  let longest = 0;
  let streak = 0;
  let prevDate: Date | null = null;

  for (let i = 0; i < dates.length; i++) {
    const d = new Date(dates[i]);
    d.setHours(0, 0, 0, 0);

    if (i === 0) {
      const dayDiff = Math.round((today.getTime() - d.getTime()) / 86400000);
      if (dayDiff > 1) break; // Most recent test was more than yesterday — streak is 0
      streak = 1;
    } else if (prevDate) {
      const diff = Math.round((prevDate.getTime() - d.getTime()) / 86400000);
      if (diff === 1) {
        streak++;
      } else {
        if (i === 1 || streak > longest) longest = streak;
        streak = 1;
      }
    }

    if (i === 0) current = streak;
    prevDate = d;
  }

  longest = Math.max(longest, streak, current);
  return { current, longest };
}

// ─── Personal Best Detection ────────────────────────────────

/** Check if the most recent test is a new personal best */
export function checkPersonalBest(records: TestRecord[]): {
  isNewBest: boolean;
  type?: "fev1" | "ratio";
  value?: number;
} {
  if (records.length < 2) return { isNewBest: false };
  const latest = records[0];
  const previous = records.slice(1);
  const prevBestFev1 = Math.max(...previous.map(r => r.fev1));
  const prevBestRatio = Math.max(...previous.map(r => r.ratio));

  if (latest.fev1 > prevBestFev1) return { isNewBest: true, type: "fev1", value: latest.fev1 };
  if (latest.ratio > prevBestRatio) return { isNewBest: true, type: "ratio", value: latest.ratio };
  return { isNewBest: false };
}

// ─── Badge Definitions ──────────────────────────────────────

const BADGE_DEFS = [
  { id: "first_test", name: "First Step", description: "Completed your first spirometry test", icon: "🌱", color: "#059669", requires: (r: TestRecord[], s: number) => r.length >= 1 },
  { id: "streak_3",  name: "3-Day Streak", description: "Tested 3 days in a row", icon: "🔥", color: "#f59e0b", requires: (_: TestRecord[], s: number) => s >= 3 },
  { id: "streak_7",  name: "Weekly Warrior", description: "7-day testing streak", icon: "⚡", color: "#D97706", requires: (_: TestRecord[], s: number) => s >= 7 },
  { id: "streak_14", name: "Fortnight Champion", description: "14-day testing streak", icon: "💎", color: "#3B82F6", requires: (_: TestRecord[], s: number) => s >= 14 },
  { id: "streak_30", name: "Iron Lungs", description: "30-day testing streak — legendary!", icon: "👑", color: "#7c3aed", requires: (_: TestRecord[], s: number) => s >= 30 },
  { id: "tests_5",   name: "Getting Serious", description: "Completed 5 tests total", icon: "📊", color: "#3B82F6", requires: (r: TestRecord[]) => r.length >= 5 },
  { id: "tests_10",  name: "Dedicated Tracker", description: "Completed 10 tests total", icon: "🏆", color: "#D97706", requires: (r: TestRecord[]) => r.length >= 10 },
  { id: "tests_25",  name: "Health Champion", description: "Completed 25 tests total", icon: "🥇", color: "#059669", requires: (r: TestRecord[]) => r.length >= 25 },
  { id: "green_5",   name: "Clean Bill", description: "5 consecutive tests in the green zone", icon: "🫁", color: "#059669", requires: (r: TestRecord[]) => r.length >= 5 && r.slice(0, 5).every(t => t.status === "green") },
];

export function calcBadges(records: TestRecord[], currentStreak: number): Badge[] {
  return BADGE_DEFS.map(def => ({
    id: def.id,
    name: def.name,
    description: def.description,
    icon: def.icon,
    color: def.color,
    unlocked: def.requires(records, currentStreak),
  }));
}

// ─── Full Stats ─────────────────────────────────────────────

export function getGamificationStats(): GamificationStats {
  const records = loadHistory();
  const { current, longest } = calcStreak(records);
  const personalBest = checkPersonalBest(records);
  const badges = calcBadges(records, current);
  const bestFev1 = records.length > 0 ? Math.max(...records.map(r => r.fev1)) : 0;
  const bestRatio = records.length > 0 ? Math.max(...records.map(r => r.ratio)) : 0;

  return {
    currentStreak: current,
    longestStreak: longest,
    totalTests: records.length,
    bestFev1,
    bestRatio,
    badges,
    isNewPersonalBest: personalBest.isNewBest,
    newPersonalBestType: personalBest.type,
  };
}
