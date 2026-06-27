/**
 * gamification.ts — RPG progression logic for ReVive pulmonology training
 */
import { loadHistory } from "./storage";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;       // emoji or lucide icon name
  rarity: "common" | "rare" | "epic" | "legendary";
  unlocked: boolean;
  unlockedAt?: string;
}

export interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  lastCheckIn?: string; // ISO date string
  achievements: Achievement[];
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "daily_breather",
    title: "Daily Breather",
    description: "Complete your first spirometry check of the day",
    icon: "🫁",
    rarity: "common",
    unlocked: false
  },
  {
    id: "wind_rider",
    title: "Wind Rider",
    description: "Perform 5 total spirometry lung tests",
    icon: "💨",
    rarity: "rare",
    unlocked: false
  },
  {
    id: "diaphragm_master",
    title: "Diaphragm Master",
    description: "Perform 20 total spirometry lung tests",
    icon: "🏆",
    rarity: "epic",
    unlocked: false
  },
  {
    id: "consistent_legend",
    title: "Consistent Legend",
    description: "Maintain a 3-day active lung testing streak",
    icon: "🔥",
    rarity: "epic",
    unlocked: false
  },
  {
    id: "sharing_is_caring",
    title: "Sharing is Caring",
    description: "Share your diagnostics history with a doctor via QR code",
    icon: "🩺",
    rarity: "legendary",
    unlocked: false
  }
];

const KEYS = {
  XP: "revive_xp",
  LEVEL: "revive_level",
  STREAK: "revive_streak",
  LAST_CHECKIN: "revive_last_checkin",
  ACHIEVEMENTS: "revive_achievements"
} as const;

export function getXpNeededForLevel(level: number): number {
  return level * 100; // e.g., Level 1 -> 100xp, Level 2 -> 200xp, Level 3 -> 300xp
}

export function getLevelTitle(level: number): string {
  if (level >= 5) return "Lung Titan";
  if (level === 4) return "Breath Legend";
  if (level === 3) return "Wind Rider";
  if (level === 2) return "Oxygen Explorer";
  return "Pulmonary Initiate";
}

export function loadGamificationState(): GamificationState {
  try {
    const xp = parseInt(localStorage.getItem(KEYS.XP) || "0", 10);
    const level = parseInt(localStorage.getItem(KEYS.LEVEL) || "1", 10);
    const streak = parseInt(localStorage.getItem(KEYS.STREAK) || "0", 10);
    const lastCheckIn = localStorage.getItem(KEYS.LAST_CHECKIN) || undefined;
    
    let achievements = [...DEFAULT_ACHIEVEMENTS];
    const rawAch = localStorage.getItem(KEYS.ACHIEVEMENTS);
    if (rawAch) {
      const parsed = JSON.parse(rawAch) as Partial<Achievement>[];
      achievements = DEFAULT_ACHIEVEMENTS.map(def => {
        const found = parsed.find(p => p.id === def.id);
        return found ? { ...def, ...found } : def;
      });
    }
    
    return { xp, level, streak, lastCheckIn, achievements };
  } catch {
    return { xp: 0, level: 1, streak: 0, achievements: [...DEFAULT_ACHIEVEMENTS] };
  }
}

export function saveGamificationState(state: GamificationState): void {
  try {
    localStorage.setItem(KEYS.XP, state.xp.toString());
    localStorage.setItem(KEYS.LEVEL, state.level.toString());
    localStorage.setItem(KEYS.STREAK, state.streak.toString());
    if (state.lastCheckIn) {
      localStorage.setItem(KEYS.LAST_CHECKIN, state.lastCheckIn);
    }
    localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(state.achievements));
  } catch {}
}

export interface XpGainResult {
  leveledUp: boolean;
  newLevel: number;
  newXp: number;
  xpNeeded: number;
}

/** Adds XP and handles levels */
export function addXp(amount: number): XpGainResult {
  const state = loadGamificationState();
  state.xp += amount;
  
  let leveledUp = false;
  let xpNeeded = getXpNeededForLevel(state.level);
  
  while (state.xp >= xpNeeded) {
    state.xp -= xpNeeded;
    state.level += 1;
    leveledUp = true;
    xpNeeded = getXpNeededForLevel(state.level);
  }
  
  saveGamificationState(state);
  return {
    leveledUp,
    newLevel: state.level,
    newXp: state.xp,
    xpNeeded
  };
}

/** Updates daily check-in streak */
export function updateStreak(): { streakUpdated: boolean; currentStreak: number } {
  const state = loadGamificationState();
  const today = new Date().toDateString();
  
  if (state.lastCheckIn === today) {
    return { streakUpdated: false, currentStreak: state.streak };
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toDateString();
  
  let currentStreak = state.streak;
  if (state.lastCheckIn === yesterdayString) {
    // Continued streak
    currentStreak += 1;
  } else {
    // Reset streak or starting fresh
    currentStreak = 1;
  }
  
  state.streak = currentStreak;
  state.lastCheckIn = today;
  saveGamificationState(state);
  
  return { streakUpdated: true, currentStreak };
}

/** Unlocks a specific achievement */
export function unlockAchievement(id: string): { unlockedNow: boolean; achievement?: Achievement } {
  const state = loadGamificationState();
  const achIndex = state.achievements.findIndex(a => a.id === id);
  
  if (achIndex === -1 || state.achievements[achIndex].unlocked) {
    return { unlockedNow: false };
  }
  
  state.achievements[achIndex].unlocked = true;
  state.achievements[achIndex].unlockedAt = new Date().toISOString();
  saveGamificationState(state);
  
  return { 
    unlockedNow: true, 
    achievement: state.achievements[achIndex] 
  };
}

/** Scans and awards achievements based on stats */
export function runAchievementScan(stats: {
  totalTests: number;
  streak: number;
  sharedQr: boolean;
}): Achievement[] {
  const state = loadGamificationState();
  let stateChanged = false;
  
  const newlyUnlocked: Achievement[] = [];
  
  state.achievements.forEach((ach) => {
    if (ach.unlocked) return;
    
    let shouldUnlock = false;
    
    if (ach.id === "daily_breather" && stats.totalTests >= 1) {
      shouldUnlock = true;
    } else if (ach.id === "wind_rider" && stats.totalTests >= 5) {
      shouldUnlock = true;
    } else if (ach.id === "diaphragm_master" && stats.totalTests >= 20) {
      shouldUnlock = true;
    } else if (ach.id === "consistent_legend" && stats.streak >= 3) {
      shouldUnlock = true;
    } else if (ach.id === "sharing_is_caring" && stats.sharedQr) {
      shouldUnlock = true;
    }
    
    if (shouldUnlock) {
      ach.unlocked = true;
      ach.unlockedAt = new Date().toISOString();
      newlyUnlocked.push(ach);
      stateChanged = true;
    }
  });
  
  if (stateChanged) {
    saveGamificationState(state);
  }
  
  return newlyUnlocked;
}

export function getGamificationStats() {
  const state = loadGamificationState();
  const history = loadHistory();
  
  // Calculate personal bests
  let bestFev1 = 0;
  let bestRatio = 0;
  history.forEach(r => {
    if (r.fev1 > bestFev1) bestFev1 = r.fev1;
    if (r.ratio > bestRatio) bestRatio = r.ratio;
  });
  
  // Is the latest test a personal best?
  let isNewPersonalBest = false;
  let newPersonalBestType: "fev1" | "ratio" = "fev1";
  if (history.length > 0) {
    const latest = history[0];
    const rest = history.slice(1);
    const prevBestFev1 = rest.reduce((max, r) => r.fev1 > max ? r.fev1 : max, 0);
    const prevBestRatio = rest.reduce((max, r) => r.ratio > max ? r.ratio : max, 0);
    
    if (rest.length > 0 && latest.fev1 > prevBestFev1) {
      isNewPersonalBest = true;
      newPersonalBestType = "fev1";
    } else if (rest.length > 0 && latest.ratio > prevBestRatio) {
      isNewPersonalBest = true;
      newPersonalBestType = "ratio";
    }
  }
  
  // Track longest check-in streak
  const longestStreak = parseInt(localStorage.getItem("revive_longest_streak") || state.streak.toString(), 10);
  if (state.streak > longestStreak) {
    localStorage.setItem("revive_longest_streak", state.streak.toString());
  }
  
  return {
    xp: state.xp,
    level: state.level,
    currentStreak: state.streak,
    longestStreak: Math.max(state.streak, longestStreak),
    badges: state.achievements,
    isNewPersonalBest,
    newPersonalBestType,
    bestFev1,
    bestRatio
  };
}
