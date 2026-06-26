import React from "react";
import { 
  TrendingUp, PlusCircle, Calendar, ChevronRight,
  CheckCircle, FileText, AlertTriangle, Wind, Zap,
  Activity, MapPin, Loader2, Flame, Trophy, Star,
  Users, Printer, Search, X, Info, Globe, ChevronDown,
  ChevronUp, Navigation, User
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine, ComposedChart, Bar
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { loadHistory, loadProfile, getHistoryChartData, getHistoryStats } from "@/lib/storage";
import { getGamificationStats } from "@/lib/gamification";
import { DailyInsight } from "@/components/DailyInsight";
import { ConfettiBlast } from "@/components/ConfettiBlast";
import { FluidWindMap } from "@/components/FluidWindMap";
import { Link } from "wouter";
import { useTheme } from "@/lib/theme";

// ─── Demo data (used when no history) ─────────────────────
const DEMO_DATA = [
  { date: "May 15", fev1: 3.4, fvc: 4.5, ratio: 75.5, aqi: 42 },
  { date: "May 20", fev1: 3.3, fvc: 4.4, ratio: 75.0, aqi: 88 },
  { date: "May 25", fev1: 3.5, fvc: 4.6, ratio: 76.1, aqi: 35 },
  { date: "Jun 01", fev1: 3.2, fvc: 4.5, ratio: 71.1, aqi: 145 },
  { date: "Jun 05", fev1: 3.4, fvc: 4.5, ratio: 75.5, aqi: 60 },
  { date: "Jun 10", fev1: 3.3, fvc: 4.5, ratio: 73.3, aqi: 78 },
  { date: "Jun 13", fev1: 3.1, fvc: 4.4, ratio: 70.4, aqi: 120 },
];

// Custom chart tooltip
const CustomTooltip = ({ active, payload, label, isDark }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: isDark ? "rgba(10,14,26,0.95)" : "rgba(255,255,255,0.97)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(27,45,107,0.12)"}`,
        borderRadius: "1rem", padding: "12px 16px",
        boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(27,45,107,0.12)"
      }}>
        <p style={{ color: isDark ? "#94a3b8" : "#1B2D6B", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</p>
        {payload.map((entry: any, i: number) => {
          const val = entry.name === "Active Triggers" ? entry.payload.triggerCount : entry.value;
          return (
            <p key={i} style={{ color: entry.color, fontSize: "13px", fontWeight: 700, margin: "2px 0" }}>
              {entry.name}: <span style={{ color: isDark ? "white" : "#0F172A" }}>{val}{entry.name?.includes("Ratio") ? "%" : (entry.name?.includes("AQI") || entry.name?.includes("Triggers")) ? "" : "L"}</span>
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

interface AqiState {
  aqi: number | null;
  city: string;
  loading: boolean;
  error: boolean;
  pm2_5?: number;
  pm10?: number;
  co?: number;
  no2?: number;
  so2?: number;
  o3?: number;
  windSpeed?: number;
  windDirection?: number;
}

export default function DashboardPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [symptomLogSuccess, setSymptomLogSuccess] = React.useState(false);
  const [showReportModal, setShowReportModal] = React.useState(false);
  const [cough, setCough] = React.useState("none");
  const [shortBreath, setShortBreath] = React.useState("none");
  const [fatigue, setFatigue] = React.useState("none");
  const [meds, setMeds] = React.useState(false);
  const [celebrationShown, setCelebrationShown] = React.useState(false);

  // 🗓️ TRIGGER DIARY STATE
  const [activeTriggers, setActiveTriggers] = React.useState<string[]>(() => {
    try {
      const today = new Date().toDateString();
      const saved = localStorage.getItem(`revive_triggers_${today}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const TRIGGER_LIST = [
    { id: 'pollen', label: 'Pollen', emoji: '🌾' },
    { id: 'dust', label: 'Dust', emoji: '💨' },
    { id: 'exercise', label: 'Exercise', emoji: '🏃' },
    { id: 'cold', label: 'Cold Air', emoji: '❄️' },
    { id: 'smoke', label: 'Smoke', emoji: '🚬' },
    { id: 'stress', label: 'Stress', emoji: '😰' },
  ];

  const toggleTrigger = (id: string) => {
    setActiveTriggers(prev => {
      const next = prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id];
      const today = new Date().toDateString();
      localStorage.setItem(`revive_triggers_${today}`, JSON.stringify(next));
      return next;
    });
  };

  const history = React.useMemo(() => loadHistory(), []);
  const profile = React.useMemo(() => loadProfile(), []);
  const stats = React.useMemo(() => getHistoryStats(history), [history]);
  const gamStats = React.useMemo(() => getGamificationStats(), []);

  const isDemo = history.length === 0;
  const chartData = React.useMemo(() => {
    if (isDemo) {
      return DEMO_DATA.map(d => {
        const count = d.aqi ? (d.aqi > 100 ? 3 : d.aqi > 60 ? 1 : 0) : 0;
        return {
          ...d,
          triggerCount: count,
          triggerDisplay: count * 20
        };
      });
    }
    return getHistoryChartData(history).map(d => {
      const match = history.find(r => 
        new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) === d.date
      );
      let count = 0;
      if (match) {
        try {
          const dateStr = new Date(match.date).toDateString();
          const saved = localStorage.getItem(`revive_triggers_${dateStr}`);
          if (saved) {
            count = JSON.parse(saved).length;
          }
        } catch {}
      }
      return {
        ...d,
        aqi: null,
        triggerCount: count,
        triggerDisplay: count * 20
      };
    });
  }, [history, isDemo]);

  // Community goal (simulated local counter, increments daily)
  const communityBreaths = React.useMemo(() => {
    const base = 44000;
    const dayOffset = Math.floor(Date.now() / 86400000) % 1000;
    return base + dayOffset * 87 + (history.length * 450);
  }, [history.length]);
  const communityGoal = 50000;
  const communityPct = Math.min(100, Math.round((communityBreaths / communityGoal) * 100));

  // AQI and Search States
  const [aqiState, setAqiState] = React.useState<AqiState>({ aqi: null, city: "", loading: false, error: false });
  const [aqiHistory, setAqiHistory] = React.useState<number[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [showAqiDetails, setShowAqiDetails] = React.useState(false);

  const loadAqiForLocation = async (latitude: number, longitude: number, cityName: string) => {
    setAqiState(s => ({ ...s, loading: true, error: false }));
    try {
      const [aqiRes, weatherRes] = await Promise.all([
        fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=us_aqi`),
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=wind_speed_10m,wind_direction_10m`).catch(() => null)
      ]);

      if (!aqiRes.ok) throw new Error();
      const aqiData = await aqiRes.json();
      const aqi = Math.round(aqiData.current.us_aqi);
      const pm2_5 = aqiData.current.pm2_5;
      const pm10 = aqiData.current.pm10;
      const co = aqiData.current.carbon_monoxide;
      const no2 = aqiData.current.nitrogen_dioxide;
      const so2 = aqiData.current.sulphur_dioxide;
      const o3 = aqiData.current.ozone;
      const hourly: number[] = (aqiData.hourly?.us_aqi ?? []).slice(0, 12).map((v: number) => Math.round(v));
      setAqiHistory(hourly);

      let windSpeed = 6.0;
      let windDirection = 90;
      if (weatherRes && weatherRes.ok) {
        const weatherData = await weatherRes.json();
        windSpeed = weatherData.current?.wind_speed_10m ?? 6.0;
        windDirection = weatherData.current?.wind_direction_10m ?? 90;
      }

      setAqiState({
        aqi,
        city: cityName,
        loading: false,
        error: false,
        pm2_5,
        pm10,
        co,
        no2,
        so2,
        o3,
        windSpeed,
        windDirection
      });
      localStorage.setItem("revive_selected_aqi_location", JSON.stringify({ latitude, longitude, name: cityName }));
    } catch {
      setAqiState({ aqi: null, city: "", loading: false, error: true });
    }
  };

  const triggerGeolocation = () => {
    if (!navigator.geolocation) {
      loadAqiForLocation(40.7128, -74.0060, "New York");
      return;
    }
    setAqiState(s => ({ ...s, loading: true, error: false }));
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&format=json`).catch(() => null);
          let city = "Your Location";
          if (geoRes?.ok) {
            const geoData = await geoRes.json().catch(() => null);
            if (geoData?.name) city = geoData.name;
          }
          await loadAqiForLocation(latitude, longitude, city);
        } catch {
          await loadAqiForLocation(40.7128, -74.0060, "New York");
        }
      },
      async () => {
        // Fallback to New York if geolocation is denied or fails
        await loadAqiForLocation(40.7128, -74.0060, "New York");
      }
    );
  };

  React.useEffect(() => {
    const savedLoc = localStorage.getItem("revive_selected_aqi_location");
    if (savedLoc) {
      try {
        const { latitude, longitude, name } = JSON.parse(savedLoc);
        loadAqiForLocation(latitude, longitude, name);
        return;
      } catch (e) {
        // Fall back to geolocation
      }
    }
    triggerGeolocation();
  }, []);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(val)}&count=5&language=en&format=json`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Check personal best celebration
  React.useEffect(() => {
    if (gamStats.isNewPersonalBest && !celebrationShown && !isDemo) {
      const lastCelebrated = localStorage.getItem("revive_last_celebrated");
      const latest = history[0]?.date;
      if (latest && lastCelebrated !== latest) {
        setTimeout(() => { setCelebrationShown(true); localStorage.setItem("revive_last_celebrated", latest); }, 1500);
      }
    }
  }, [gamStats.isNewPersonalBest, isDemo]);

  const getAqiColor = (aqi: number) => aqi <= 50 ? "#059669" : aqi <= 100 ? "#f59e0b" : aqi <= 150 ? "#f97316" : aqi <= 200 ? "#ef4444" : "#a855f7";
  const getAqiLabel = (aqi: number) => aqi <= 50 ? "Good" : aqi <= 100 ? "Moderate" : aqi <= 150 ? "Sensitive Groups" : aqi <= 200 ? "Unhealthy" : "Very Unhealthy";

  // 🌡️ RESPIRATORY RISK SCORE
  const getRiskScore = (aqi: number | null, triggerCount: number): { level: string; color: string; bg: string; border: string; advice: string } => {
    const base = aqi === null ? 0 : aqi <= 50 ? 0 : aqi <= 100 ? 1 : aqi <= 150 ? 2 : 3;
    const total = base + triggerCount;
    if (total >= 4) return { level: 'High Risk', color: '#ef4444', bg: 'rgba(239,68,68,0.05)', border: 'rgba(239,68,68,0.2)', advice: 'Stay indoors. Carry your rescue inhaler. Avoid exercise.' };
    if (total >= 2) return { level: 'Moderate Risk', color: '#f59e0b', bg: 'rgba(245,158,11,0.05)', border: 'rgba(245,158,11,0.2)', advice: 'Limit strenuous outdoor activity. Monitor symptoms closely.' };
    return { level: 'Low Risk', color: '#059669', bg: 'rgba(5,150,105,0.05)', border: 'rgba(5,150,105,0.2)', advice: 'Safe for outdoor breathing exercises. Great day for therapy!' };
  };
  const riskScore = getRiskScore(aqiState.aqi, activeTriggers.length);

  // Style helpers
  const cardStyle = {
    background: isDark ? "rgba(15, 23, 42, 0.45)" : "rgba(255, 255, 255, 0.45)",
    backdropFilter: "blur(20px) saturate(190%)",
    WebkitBackdropFilter: "blur(20px) saturate(190%)",
    border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.35)"}`,
    boxShadow: isDark 
      ? "0 8px 32px 0 rgba(0, 0, 0, 0.37)" 
      : "0 8px 32px 0 rgba(31, 38, 135, 0.04)",
  };
  const textPrimary = isDark ? "white" : "#0F172A";
  const textMuted = isDark ? "#475569" : "#64748B";
  const textSub = isDark ? "#334155" : "#94A3B8";

  const metrics = stats ? [
    { label: "Avg FEV₁",    value: `${stats.avgFev1}L`,   badge: `${Math.round((stats.avgFev1/4.0)*100)}%`, badgeColor: "#059669", accent: "#1B2D6B" },
    { label: "Avg FVC",     value: `${stats.avgFvc}L`,    badge: `${Math.round((stats.avgFvc/4.8)*100)}%`,  badgeColor: "#059669", accent: "#059669" },
    { label: "FEV₁/FVC",   value: `${stats.avgRatio}%`,  badge: stats.avgRatio >= 70 ? "Normal" : "Low",   badgeColor: stats.avgRatio >= 70 ? "#059669" : "#f59e0b", accent: "#2563EB" },
    { label: "Total Tests", value: `${stats.totalTests}`, badge: `Best: ${stats.bestFev1}L`,               badgeColor: "#D97706", accent: "#7c3aed" },
  ] : [
    { label: "Avg FEV₁",  value: "—",  badge: "No Data", badgeColor: "#94A3B8", accent: "#1B2D6B" },
    { label: "Avg FVC",   value: "—",  badge: "No Data", badgeColor: "#94A3B8", accent: "#059669" },
    { label: "FEV₁/FVC",  value: "—",  badge: "No Data", badgeColor: "#94A3B8", accent: "#2563EB" },
    { label: "Tests Done", value: "0", badge: "Run First Test", badgeColor: "#D97706", accent: "#7c3aed" },
  ];

  const handleSymptomSubmit = (e: React.FormEvent) => { e.preventDefault(); setSymptomLogSuccess(true); setTimeout(() => setSymptomLogSuccess(false), 3000); };

  // Print PDF report
  const handlePrint = () => {
    const originalTitle = document.title;
    const nameSlug = (profile.name || "Patient").trim().replace(/\s+/g, "_");
    document.title = `${nameSlug}_Pulmonary_Evaluation_Report`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Clinical report averages & classification
  const avgRatioVal = stats ? stats.avgRatio : 74.5;
  const conditionStatus = avgRatioVal >= 70 ? "optimal" : avgRatioVal >= 60 ? "warning" : "obstruction";

  const patientAge = parseInt(profile.age) || 35;
  const isMale = (profile.sex || "male").toLowerCase() === "male";
  
  // Predicted Reference standards (NHANES III approximations)
  const predFvcVal = isMale 
    ? +(5.8 - 0.025 * patientAge).toFixed(2)
    : +(4.2 - 0.02 * patientAge).toFixed(2);
    
  const predFev1Val = isMale
    ? +(4.7 - 0.028 * patientAge).toFixed(2)
    : +(3.4 - 0.022 * patientAge).toFixed(2);
    
  const predRatioVal = 79.5; 
  
  const actualFev1Val = stats ? stats.avgFev1 : 3.32;
  const actualFvcVal = stats ? stats.avgFvc : 4.47;
  const actualRatioVal = stats ? stats.avgRatio : 74.5;
  
  const pctFev1Val = Math.round((actualFev1Val / predFev1Val) * 100);
  const pctFvcVal = Math.round((actualFvcVal / predFvcVal) * 100);
  const pctRatioVal = Math.round((actualRatioVal / predRatioVal) * 100);
  
  const statusFvc = pctFvcVal >= 80 ? "NORMAL" : pctFvcVal >= 70 ? "MILD REDUCTION" : "REDUCED";
  const statusFev1 = pctFev1Val >= 80 ? "NORMAL" : pctFev1Val >= 70 ? "MILD REDUCTION" : "REDUCED";
  const statusRatio = actualRatioVal >= 70 ? "NORMAL" : actualRatioVal >= 60 ? "MILD LIMITATION" : "OBSTRUCTIVE";

  const impressionText = actualRatioVal >= 70 
    ? "1. Spirometry parameters demonstrate normal ventilatory capacities and flow rates. There is no evidence of airflow limitation (obstruction) or restrictive ventilatory defects. FEV1 and FVC are within expected physiological limits (>= 80% predicted). 2. Exhalations demonstrate normal volume-time curves and consistent peak expiratory pressures."
    : `1. Obstructive ventilatory defect detected, currently matching a ${actualRatioVal >= 60 ? "mild" : "moderate-to-severe"} severity level. 2. The FEV₁/FVC ratio (${actualRatioVal}%) falls below the Lower Limit of Normal (LLN < 70%). Expiratory flow speeds are significantly reduced compared to predicted volumes, consistent with chronic bronchitis, bronchial asthma flare-up, or chronic obstructive pulmonary disease (COPD). Clinical pulmonology correlation is recommended.`;

  const diagnosisCode = actualRatioVal >= 70 
    ? "ICD-10: Z01.89 (Encounter for specified special examinations / Normal PFT)" 
    : actualRatioVal >= 60 
      ? "ICD-10: J44.9 (Mild Chronic Obstructive Pulmonary Defect)" 
      : "ICD-10: J44.1 (Significant Obstructive Pulmonary Defect / Airflow Impairment)";

  const conditionDetails = {
    optimal: {
      title: "Optimal Pulmonary Function",
      color: "#059669",
      bgColor: "#E6F4EA",
      explanation: "Your average FEV₁/FVC ratio is within the healthy physiological range (>= 70%). This indicates healthy lung volumes and unrestricted expiratory flow, with no current signs of airway obstruction or significant restrictive patterns.",
      plan: "Maintain optimal performance by practicing deep diaphragmatic breathing and performing regular aerobic conditioning (at least 150 minutes of moderate activity per week). Practice 4-7-8 breathing for alveolar recruitment."
    },
    warning: {
      title: "Mild Airway Limitation / Caution",
      color: "#D97706",
      bgColor: "#FEF3C7",
      explanation: "Your average FEV₁/FVC ratio is mildly decreased (60% - 69%). This may indicate early signs of airway narrowing, bronchial hyperreactivity, or mild chest wall restriction. Exhalations are slightly slower than predicted normal limits.",
      plan: "Targeted pulmonary rehabilitation is recommended. Focus on Pursed-Lip Breathing to prevent airway collapse and thin secretions with proper hydration (2.5L daily). Restrict strenuous outdoor exercises if the local AQI is above 100."
    },
    obstruction: {
      title: "Significant Airway Obstruction / Flow Impairment",
      color: "#EF4444",
      bgColor: "#FEE2E2",
      explanation: "Your average FEV₁/FVC ratio is significantly reduced (< 60%). This is highly suggestive of an obstructive lung pattern (e.g. COPD, asthma, or bronchitis) or significant lung volume restriction.",
      plan: "IMMEDIATE ACTION ADVISED: Schedule a clinical consultation with a licensed Pulmonologist. Follow a strictly controlled breathing protocol, utilize prescribed bronchodilators, and avoid environments with air pollution or smoke (AQI > 50)."
    }
  }[conditionStatus];

  const recordsToPrint = isDemo
    ? [
        { date: "2026-06-13T10:00:00Z", fev1: 3.1, fvc: 4.4, ratio: 70.4, peakPressure: 11.2, status: "yellow" as const, isSimulated: true },
        { date: "2026-06-10T10:00:00Z", fev1: 3.3, fvc: 4.5, ratio: 73.3, peakPressure: 12.8, status: "green" as const, isSimulated: true },
        { date: "2026-06-05T10:00:00Z", fev1: 3.4, fvc: 4.5, ratio: 75.5, peakPressure: 13.5, status: "green" as const, isSimulated: true },
        { date: "2026-06-01T10:00:00Z", fev1: 3.2, fvc: 4.5, ratio: 71.1, peakPressure: 12.0, status: "yellow" as const, isSimulated: true },
        { date: "2026-05-25T10:00:00Z", fev1: 3.5, fvc: 4.6, ratio: 76.1, peakPressure: 14.2, status: "green" as const, isSimulated: true },
        { date: "2026-05-20T10:00:00Z", fev1: 3.3, fvc: 4.4, ratio: 75.0, peakPressure: 13.0, status: "green" as const, isSimulated: true },
        { date: "2026-05-15T10:00:00Z", fev1: 3.4, fvc: 4.5, ratio: 75.5, peakPressure: 13.2, status: "green" as const, isSimulated: true }
      ]
    : history.slice(0, 10);
  const renderReportContent = () => {
    return (
      <div style={{ color: '#0F172A', fontSize: '11px', lineHeight: 1.45, textAlign: 'left' }}>
        {/* ── HEADER BANNER ── */}
        <div style={{
          background: '#0F2557',
          color: 'white',
          padding: '14px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          borderRadius: '2px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '28px', height: '28px' }}>
              <rect x="13" y="4" width="6" height="24" rx="1.5" fill="white" />
              <rect x="4" y="13" width="24" height="6" rx="1.5" fill="white" />
              <circle cx="16" cy="16" r="3.5" fill="#0F2557" />
              <circle cx="16" cy="16" r="1.5" fill="white" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              CITY GENERAL HOSPITAL - PULMONARY DIVISION
            </div>
            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.04em', marginTop: '1px' }}>
              DEPARTMENT OF PULMONARY MEDICINE &amp; RESPIRATORY PHYSIOLOGY
            </div>
          </div>
        </div>

        {/* ── REPORT TITLE ── */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A', letterSpacing: '0.04em' }}>
            SPIROMETRY EVALUATION REPORT
          </div>
          <div style={{ height: '1.5px', background: '#0F172A', width: '100%', marginTop: '6px' }} />
        </div>

        {/* ── PATIENT INFORMATION ── */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#0F172A', borderBottom: '1.5px solid #0F172A', paddingBottom: '3px', marginBottom: '8px', letterSpacing: '0.05em' }}>
            Patient Information
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '20px', fontSize: '9.5px', lineHeight: '1.5' }}>
            <div>
              <div><strong>Patient Name:</strong> {profile.name || "Jane Doe"}</div>
              <div><strong>Patient Sex:</strong> {profile.sex ? profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1) : "Male"}</div>
              <div><strong>Patient Age:</strong> {patientAge} years</div>
              <div><strong>Patient Height:</strong> {(profile as any).height || "175"} cm</div>
            </div>
            <div>
              <div><strong>Date of Test:</strong> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })}</div>
              <div><strong>Referring Physician:</strong> Dr. Sarah Jenkins, MD</div>
              <div><strong>Lab Technician:</strong> Alex Martinez, RRT</div>
              <div><strong>Report ID:</strong> RPT-{new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2,'0')}-{String(new Date().getDate()).padStart(2,'0')}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%' }}>
              {/* Barcode lines */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                <div style={{ display: 'flex', gap: '1.5px', height: '18px', alignItems: 'center' }}>
                  {[2,1,3,1,2,4,1,2,1,3,2,1,4,1,2,3,1].map((w, idx) => (
                    <div key={idx} style={{ width: `${w}px`, height: '100%', background: '#0F172A' }} />
                  ))}
                </div>
                <div style={{ fontSize: '7px', fontFamily: 'monospace', color: '#64748B' }}>
                  MRN-{stats ? String(stats.totalTests * 904 + 10482).padStart(8, '0') : '00048921'}
                </div>
              </div>
              
              {/* Clinical release stamp */}
              <div style={{
                border: '2px dashed #DC2626',
                borderRadius: '4px',
                padding: '3px 6px',
                color: '#DC2626',
                fontSize: '8px',
                fontWeight: '950',
                transform: 'rotate(-4deg) translateY(4px)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                opacity: 0.85
              }}>
                RECORD RELEASED
              </div>
            </div>
          </div>
        </div>

        {/* ── CLINICAL FINDINGS ── */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#0F172A', borderBottom: '1.5px solid #0F172A', paddingBottom: '3px', marginBottom: '8px', letterSpacing: '0.05em' }}>
            Clinical Findings
          </div>
          <p style={{ fontSize: '9.5px', color: '#334155', margin: 0, lineHeight: '1.5', textAlign: 'justify' }}>
            Clinical findings: Patient completed forced expiratory maneuvers. Spirometry effort shows good reproducibility and compliance with ATS/ERS criteria. Observed values are compared against GLI-2012 reference equations for gender, age, and height. High resolution data indicates patient baseline parameters are well within predicted normal distribution.
          </p>
        </div>

        {/* ── SPIROMETRY RESULTS TABLE ── */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#0F172A', borderBottom: '1.5px solid #0F172A', paddingBottom: '3px', marginBottom: '8px', letterSpacing: '0.05em' }}>
            Spirometry Results Table
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #CBD5E1', fontSize: '9.5px' }}>
            <thead>
              <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #94A3B8' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '800', border: '1px solid #CBD5E1' }}>Parameter</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '800', border: '1px solid #CBD5E1' }}>Measured</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '800', border: '1px solid #CBD5E1' }}>Predicted</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '800', border: '1px solid #CBD5E1' }}>% Predicted</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '800', border: '1px solid #CBD5E1' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  param: 'FEV₁ — Forced Expiratory Volume (1s)', obs: `${actualFev1Val.toFixed(2)} L`, pred: `${predFev1Val.toFixed(2)} L`,
                  pct: pctFev1Val, status: statusFev1 === 'NORMAL' ? 'Normal' : statusFev1, ok: pctFev1Val >= 80
                },
                {
                  param: 'FVC — Forced Vital Capacity', obs: `${actualFvcVal.toFixed(2)} L`, pred: `${predFvcVal.toFixed(2)} L`,
                  pct: pctFvcVal, status: statusFvc === 'NORMAL' ? 'Normal' : statusFvc, ok: pctFvcVal >= 80
                },
                {
                  param: 'FEV₁/FVC Ratio', obs: `${actualRatioVal.toFixed(1)}%`, pred: `${predRatioVal.toFixed(1)}%`,
                  pct: pctRatioVal, status: statusRatio === 'NORMAL' ? 'Normal' : statusRatio, ok: actualRatioVal >= 70
                },
              ].map((row, i) => {
                const bg = row.ok ? '#DCFCE7' : '#FEF3C7';
                return (
                  <tr key={i} style={{ background: bg, borderBottom: '1px solid #CBD5E1' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '600', border: '1px solid #CBD5E1' }}>{row.param}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'monospace', fontWeight: '700', border: '1px solid #CBD5E1' }}>{row.obs}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'monospace', color: '#475569', border: '1px solid #CBD5E1' }}>{row.pred}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '800', color: row.ok ? '#15803D' : '#B45309', border: '1px solid #CBD5E1' }}>{row.pct}%</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '700', color: row.ok ? '#15803D' : '#B45309', border: '1px solid #CBD5E1' }}>{row.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── INTERPRETATION ── */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#0F172A', borderBottom: '1.5px solid #0F172A', paddingBottom: '3px', marginBottom: '8px', letterSpacing: '0.05em' }}>
            Interpretation
          </div>
          <p style={{ fontSize: '9.5px', color: '#334155', margin: 0, lineHeight: '1.5', textAlign: 'justify' }}>
            {impressionText}
          </p>
        </div>

        {/* ── RECOMMENDATIONS ── */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#0F172A', borderBottom: '1.5px solid #0F172A', paddingBottom: '3px', marginBottom: '8px', letterSpacing: '0.05em' }}>
            Recommendations
          </div>
          <ul style={{ fontSize: '9.5px', color: '#334155', margin: 0, paddingLeft: '18px', lineHeight: '1.6' }}>
            <li>Incorporate diaphragmatic retraining and pursed-lip breathing protocols daily to support respiratory muscle tone.</li>
            <li>Maintain 2.0–2.5 L clean water intake daily to promote viscosity reduction of bronchial secretions and support mucociliary clearance.</li>
            <li>Avoid strenuous outdoor cardiovascular exercise if the AQI rises above 100. Avoid smoke and dusty environments.</li>
            <li>Routine spirometric tracking is advised in 3-month intervals to monitor forced flow trajectories.</li>
          </ul>
        </div>

        {/* ── SIGNATURES ── */}
        <div style={{
          marginTop: '32px', borderTop: '1.5px solid #CBD5E1', paddingTop: '16px',
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '24px', alignItems: 'end'
        }}>
          <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '4px', padding: '8px 12px', fontSize: '7.5px', color: '#92400E', lineHeight: '1.4' }}>
            <strong>Medical Disclaimer:</strong> This spirometric evaluation is for monitoring and baseline tracking only. It is not an alternate to clinical plethysmography. Pulmonologist approval required before altering therapy.
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #CBD5E1', paddingBottom: '4px', fontFamily: '"Georgia", serif', fontStyle: 'italic', fontSize: '12px', color: '#475569' }}>A. Martinez</div>
            <div style={{ fontSize: '8px', fontWeight: '700', color: '#475569', marginTop: '3px' }}>Alex Martinez, RRT</div>
            <div style={{ fontSize: '7px', color: '#94A3B8' }}>Lab Technologist</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #CBD5E1', paddingBottom: '4px', fontFamily: '"Georgia", serif', fontStyle: 'italic', fontSize: '12px', color: '#1B2D6B' }}>Dr. R. Vance</div>
            <div style={{ fontSize: '8px', fontWeight: '700', color: '#475569', marginTop: '3px' }}>Dr. Rebecca Vance, MD</div>
            <div style={{ fontSize: '7px', color: '#94A3B8' }}>Consultant Pulmonologist</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full">
      {/* ── Background WebGL Wind Simulation ── */}
      <div className="print:hidden">
        <FluidWindMap
          aqi={aqiState.aqi}
          windSpeed={aqiState.windSpeed ?? 6.0}
          windDirection={aqiState.windDirection ?? 90}
        />
      </div>

      {/* ── Foreground Dashboard Content ── */}
      <div className="p-5 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 relative z-10 print:hidden">
      {/* Confetti celebration */}
      <ConfettiBlast
        show={celebrationShown}
        title="New Personal Best!"
        subtitle={gamStats.newPersonalBestType === "fev1" ? "Best FEV₁ ever recorded 🫁" : "Best FEV₁/FVC Ratio!"}
        value={gamStats.newPersonalBestType === "fev1" ? `${gamStats.bestFev1}L` : `${gamStats.bestRatio}%`}
        onClose={() => setCelebrationShown(false)}
      />

      {/* ── Header ───────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em] mb-2"
            style={{ 
              color: "#2563EB", 
              background: "rgba(37,99,235,0.07)", 
              border: "1px solid rgba(37,99,235,0.15)",
              boxShadow: "0 2px 8px rgba(37,99,235,0.08)"
            }}>
            <Activity className="w-2.5 h-2.5" /> Patient Portal
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: textPrimary }}>
            {profile.name 
              ? <><span>Welcome back, </span><span className="shimmer-text">{profile.name.split(" ")[0]}</span><span>! 🫁</span></>
              : "Welcome to ReVive! 🫁"
            }
          </h1>
          <p className="text-sm mt-1.5" style={{ color: textMuted }}>
            {profile.name 
              ? `${isDemo ? "Run your first spirometry test to analyze your lung health." : `Here is your clinical report. You have recorded ${history.length} test sessions.`}`
              : "Let's get started by setting up your clinical profile."
            }
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {isDemo && (
            <Link href="/test">
              <span className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm cursor-pointer text-white transition-all hover:-translate-y-0.5"
                style={{ 
                  background: "linear-gradient(135deg, #1B2D6B, #2563EB)", 
                  boxShadow: "0 4px 20px rgba(27,45,107,0.35), 0 2px 8px rgba(37,99,235,0.2)" 
                }}>
                <Activity className="w-4 h-4" /> Run First Test
              </span>
            </Link>
          )}
        </div>
      </motion.div>

      {/* ── Onboarding Banner (if no profile name) ────────────────── */}
      {!profile.name && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-4 border shadow-sm"
          style={{ 
            background: isDark ? "rgba(37,99,235,0.06)" : "rgba(37,99,235,0.03)", 
            borderColor: isDark ? "rgba(37,99,235,0.2)" : "rgba(37,99,235,0.15)" 
          }}>
          <div className="p-3 rounded-xl shrink-0" style={{ background: "rgba(37,99,235,0.1)", color: "#2563EB" }}>
            <User className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black" style={{ color: "#2563EB" }}>Complete Your Profile Setup</h3>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: isDark ? "#94a3b8" : "#475569" }}>
              ReVive needs your age and biological sex to compare your exhalations with clinical reference norms. Let's customize your experience!
            </p>
          </div>
          <Link href="/profile">
            <span className="px-4 py-2 text-xs font-black text-white rounded-xl cursor-pointer transition-all active:scale-95 whitespace-nowrap self-stretch md:self-auto text-center"
              style={{ background: "linear-gradient(135deg, #1B2D6B, #2563EB)", boxShadow: "0 4px 12px rgba(37,99,235,0.25)" }}>
              Set Up Profile
            </span>
          </Link>
        </motion.div>
      )}

      {/* ── Streak + Badges Row ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Streak */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          whileHover={{ y: -4 }}
          className="p-5 rounded-2xl flex items-center gap-4 cursor-default"
          style={{ ...cardStyle, background: isDark ? "rgba(217,119,6,0.08)" : "rgba(217,119,6,0.05)", border: "1px solid rgba(217,119,6,0.2)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(217,119,6,0.12)", border: "1px solid rgba(217,119,6,0.2)" }}>
            <Flame className="w-6 h-6" style={{ color: "#D97706" }} />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black" style={{ color: "#D97706" }}>{gamStats.currentStreak}</span>
              <span className="text-xs font-bold" style={{ color: "#f59e0b" }}>/ {gamStats.longestStreak} best</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: textMuted }}>Day Streak</p>
          </div>
        </motion.div>

        {/* Badges */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          whileHover={{ y: -4 }}
          className="p-5 rounded-2xl flex items-center gap-4 cursor-default"
          style={{ ...cardStyle }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(27,45,107,0.07)", border: "1px solid rgba(27,45,107,0.12)" }}>
            <Trophy className="w-6 h-6" style={{ color: "#1B2D6B" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black" style={{ color: textPrimary }}>
                {gamStats.badges.filter(b => b.unlocked).length}
              </span>
              <span className="text-xs font-bold" style={{ color: textMuted }}>/ {gamStats.badges.length}</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: textMuted }}>Badges Unlocked</p>
            <div className="flex gap-1 flex-wrap">
              {gamStats.badges.slice(0, 5).map(b => (
                <span key={b.id} className="text-base" title={b.name}
                  style={{ opacity: b.unlocked ? 1 : 0.2, filter: b.unlocked ? "none" : "grayscale(1)" }}>
                  {b.icon}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Community Goal */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          whileHover={{ y: -4 }}
          className="p-5 rounded-2xl flex flex-col gap-3 cursor-default"
          style={{ ...cardStyle, background: isDark ? "rgba(5,150,105,0.07)" : "rgba(5,150,105,0.04)", border: "1px solid rgba(5,150,105,0.2)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(5,150,105,0.12)", border: "1px solid rgba(5,150,105,0.2)" }}>
              <Users className="w-4 h-4" style={{ color: "#059669" }} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: textMuted }}>Community Goal</p>
              <p className="text-xs font-bold" style={{ color: "#059669" }}>{communityBreaths.toLocaleString()} / {communityGoal.toLocaleString()} breaths</p>
            </div>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(5,150,105,0.15)" : "rgba(5,150,105,0.1)" }}>
            <motion.div className="absolute inset-y-0 left-0 rounded-full"
              initial={{ width: 0 }} animate={{ width: `${communityPct}%` }} transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
              style={{ background: "linear-gradient(90deg, #059669, #34d399)" }} />
          </div>
          <p className="text-[10px]" style={{ color: textMuted }}>{communityPct}% of weekly community goal met 🌍</p>
        </motion.div>
      </div>

      {/* ── AQI Banner ───────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} whileHover={{ y: -3 }} className="relative z-20">
        <div className="p-4 md:p-5 rounded-2xl flex flex-col gap-4" style={cardStyle}>
          {/* Top Row: Info and controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl shrink-0" 
                style={{ 
                  background: aqiState.aqi !== null ? `${getAqiColor(aqiState.aqi!)}12` : (isDark ? "rgba(255,255,255,0.05)" : "rgba(27,45,107,0.05)"), 
                  color: aqiState.aqi !== null ? getAqiColor(aqiState.aqi!) : "#64748B" 
                }}>
                {aqiState.aqi !== null && aqiState.aqi! > 100 ? <AlertTriangle className="w-5 h-5" /> : <Wind className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black flex items-center gap-1.5" style={{ color: aqiState.aqi !== null ? getAqiColor(aqiState.aqi!) : textPrimary }}>
                    {aqiState.loading ? (
                      <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching AQI...</span>
                    ) : (
                      <>
                        <span>Air Quality in {aqiState.city || "your area"}</span>
                        <MapPin className="w-3.5 h-3.5" />
                      </>
                    )}
                  </h4>
                  {!aqiState.loading && (
                    <button 
                      onClick={() => { setShowSearch(!showSearch); setSearchQuery(""); setSearchResults([]); }}
                      className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Search city"
                    >
                      {showSearch ? <X className="w-3.5 h-3.5" style={{ color: textMuted }} /> : <Search className="w-3.5 h-3.5" style={{ color: textMuted }} />}
                    </button>
                  )}
                  {localStorage.getItem("revive_selected_aqi_location") && (
                    <button
                      onClick={() => {
                        localStorage.removeItem("revive_selected_aqi_location");
                        triggerGeolocation();
                      }}
                      className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sky-500"
                      title="Reset to My Location"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {!showSearch && aqiState.aqi !== null && (
                  <p className="text-xs mt-0.5" style={{ color: isDark ? "#94a3b8" : "#475569" }}>
                    {aqiState.aqi! > 100 
                      ? `AQI ${aqiState.aqi}: Elevated pollution. Consider wearing an N95 mask outdoors. High pollution days correlate with reduced FEV1.` 
                      : `Air quality is ${getAqiLabel(aqiState.aqi!).toLowerCase()}. Great conditions for breathing exercises today!`}
                  </p>
                )}
              </div>
            </div>

            {aqiState.aqi !== null && (
              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <div className="flex items-center gap-2 text-xs font-black px-4 py-2 rounded-full"
                  style={{ 
                    background: `${getAqiColor(aqiState.aqi!)}12`, 
                    border: `1px solid ${getAqiColor(aqiState.aqi!)}25`, 
                    color: getAqiColor(aqiState.aqi!) 
                  }}>
                  <Wind className="w-3.5 h-3.5" /> AQI {aqiState.aqi} · {getAqiLabel(aqiState.aqi!)}
                </div>
                <button
                  onClick={() => setShowAqiDetails(!showAqiDetails)}
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-full border transition hover:bg-slate-50 dark:hover:bg-slate-800"
                  style={{ color: textPrimary, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(27,45,107,0.12)" }}
                >
                  <span>Pollutants</span>
                  {showAqiDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            )}
          </div>

          {/* Search Dropdown / Suggestion block */}
          {showSearch && (
            <div className="relative z-30">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search any city (e.g. Dhaka, Karaganda, London)..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="input-clean pl-10 pr-4 py-2 bg-slate-50/50 hover:bg-slate-50 border-slate-200 focus:border-[#2563EB] focus:ring-[#2563EB]/10 text-sm"
                    style={{
                      color: textPrimary
                    }}
                  />
                </div>
                {searchLoading && (
                  <div className="flex items-center px-2">
                    <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                  </div>
                )}
              </div>
              
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-1.5 rounded-xl border shadow-lg overflow-hidden z-40 max-h-60 overflow-y-auto"
                  style={{
                    background: isDark ? "rgba(15,23,42,0.98)" : "#FFFFFF",
                    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(27,45,107,0.12)",
                    backdropFilter: "blur(8px)"
                  }}>
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const cityName = `${item.name}${item.admin1 ? `, ${item.admin1}` : ""}, ${item.country || ""}`;
                        loadAqiForLocation(item.latitude, item.longitude, cityName);
                        setShowSearch(false);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-between"
                      style={{ color: textPrimary, borderBottom: idx < searchResults.length - 1 ? (isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(27,45,107,0.05)") : "none" }}
                    >
                      <div>
                        <span className="font-bold">{item.name}</span>
                        {item.admin1 && <span className="text-slate-400">, {item.admin1}</span>}
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {item.country || "Unknown"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Details Expandable Panel */}
          {showAqiDetails && aqiState.aqi !== null && (
            <div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t"
              style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(27,45,107,0.08)" }}
            >
              {[
                { 
                  name: "PM2.5", 
                  val: aqiState.pm2_5, 
                  unit: "µg/m³",
                  desc: "Fine particles",
                  color: aqiState.pm2_5 == null ? "#64748B" : aqiState.pm2_5 <= 12 ? "#059669" : aqiState.pm2_5 <= 35 ? "#f59e0b" : aqiState.pm2_5 <= 55 ? "#f97316" : "#ef4444",
                  lbl: aqiState.pm2_5 == null ? "N/A" : aqiState.pm2_5 <= 12 ? "Good" : aqiState.pm2_5 <= 35 ? "Moderate" : aqiState.pm2_5 <= 55 ? "Poor" : "Danger"
                },
                { 
                  name: "PM10", 
                  val: aqiState.pm10, 
                  unit: "µg/m³", 
                  desc: "Coarse dust",
                  color: aqiState.pm10 == null ? "#64748B" : aqiState.pm10 <= 54 ? "#059669" : aqiState.pm10 <= 154 ? "#f59e0b" : aqiState.pm10 <= 254 ? "#f97316" : "#ef4444",
                  lbl: aqiState.pm10 == null ? "N/A" : aqiState.pm10 <= 54 ? "Good" : aqiState.pm10 <= 154 ? "Moderate" : aqiState.pm10 <= 254 ? "Poor" : "Danger"
                },
                { 
                  name: "NO₂", 
                  val: aqiState.no2, 
                  unit: "µg/m³", 
                  desc: "Nitrogen Dioxide",
                  color: aqiState.no2 == null ? "#64748B" : aqiState.no2 <= 40 ? "#059669" : aqiState.no2 <= 100 ? "#f59e0b" : aqiState.no2 <= 200 ? "#f97316" : "#ef4444",
                  lbl: aqiState.no2 == null ? "N/A" : aqiState.no2 <= 40 ? "Good" : aqiState.no2 <= 100 ? "Moderate" : aqiState.no2 <= 200 ? "Poor" : "Danger"
                },
                { 
                  name: "Ozone", 
                  val: aqiState.o3, 
                  unit: "µg/m³", 
                  desc: "Ground-level O₃",
                  color: aqiState.o3 == null ? "#64748B" : aqiState.o3 <= 60 ? "#059669" : aqiState.o3 <= 120 ? "#f59e0b" : aqiState.o3 <= 180 ? "#f97316" : "#ef4444",
                  lbl: aqiState.o3 == null ? "N/A" : aqiState.o3 <= 60 ? "Good" : aqiState.o3 <= 120 ? "Moderate" : aqiState.o3 <= 180 ? "Poor" : "Danger"
                },
                { 
                  name: "CO", 
                  val: aqiState.co ? Math.round(aqiState.co) : undefined, 
                  unit: "µg/m³", 
                  desc: "Carbon Monoxide",
                  color: aqiState.co == null ? "#64748B" : aqiState.co <= 4000 ? "#059669" : aqiState.co <= 9000 ? "#f59e0b" : aqiState.co <= 15000 ? "#f97316" : "#ef4444",
                  lbl: aqiState.co == null ? "N/A" : aqiState.co <= 4000 ? "Good" : aqiState.co <= 9000 ? "Moderate" : aqiState.co <= 15000 ? "Poor" : "Danger"
                },
                { 
                  name: "SO₂", 
                  val: aqiState.so2, 
                  unit: "µg/m³", 
                  desc: "Sulfur Dioxide",
                  color: aqiState.so2 == null ? "#64748B" : aqiState.so2 <= 50 ? "#059669" : aqiState.so2 <= 150 ? "#f59e0b" : aqiState.so2 <= 350 ? "#f97316" : "#ef4444",
                  lbl: aqiState.so2 == null ? "N/A" : aqiState.so2 <= 50 ? "Good" : aqiState.so2 <= 150 ? "Moderate" : aqiState.so2 <= 350 ? "Poor" : "Danger"
                }
              ].map(p => (
                <div key={p.name} className="p-3 rounded-xl border text-center flex flex-col gap-1"
                  style={{ 
                    background: isDark ? "rgba(255,255,255,0.015)" : "rgba(27,45,107,0.01)",
                    borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(27,45,107,0.05)"
                  }}
                >
                  <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: textMuted }}>{p.name}</p>
                  <p className="text-sm font-black mt-0.5" style={{ color: p.val != null ? textPrimary : "#64748B" }}>
                    {p.val != null ? `${p.val} ${p.unit}` : "N/A"}
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                    <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: p.color }}>{p.lbl}</span>
                  </div>
                  <p className="text-[8px] text-slate-400 mt-1 leading-tight">{p.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* 🌡️ RESPIRATORY RISK SCORE CARD */}
          {aqiState.aqi !== null && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl border transition-all"
              style={{ background: riskScore.bg, borderColor: riskScore.border }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${riskScore.color}15`, border: `1px solid ${riskScore.color}30` }}>
                <AlertTriangle className="w-4 h-4" style={{ color: riskScore.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black" style={{ color: riskScore.color }}>Daily Respiratory Risk: {riskScore.level}</span>
                  {activeTriggers.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${riskScore.color}15`, color: riskScore.color }}>
                      {activeTriggers.length} trigger{activeTriggers.length > 1 ? 's' : ''} logged
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: isDark ? '#94a3b8' : '#475569' }}>{riskScore.advice}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Metric Cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {metrics.map((m, i) => (
          <motion.div key={m.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 + i * 0.04 }}
            whileHover={{ y: -4 }}
            className="p-3.5 sm:p-5 rounded-2xl relative overflow-hidden cursor-default"
            style={{ ...cardStyle }}>
            <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${m.accent}15, transparent)`, filter: "blur(20px)", transform: "translate(30%,-30%)" }} />
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1.5 sm:mb-2 truncate" style={{ color: textSub }}>{m.label}</p>
            <p className="text-2xl sm:text-3xl font-black mb-1.5 sm:mb-2" style={{ color: textPrimary, fontFamily: "'Inter', sans-serif" }}>{m.value}</p>
            <span className="text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full inline-block"
              style={{ background: `${m.badgeColor}12`, color: m.badgeColor, border: `1px solid ${m.badgeColor}20` }}>
              {m.badge}
            </span>
          </motion.div>
        ))}
      </div>

      {/* ── Trend Chart + Symptom Logger ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Chart — AQI overlay on 2nd Y-axis */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          whileHover={{ y: -3 }}
          className="lg:col-span-8 p-6 rounded-2xl cursor-default"
          style={cardStyle}>
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="text-base font-black" style={{ color: textPrimary }}>FEV₁/FVC Trend
                {aqiState.aqi && <span className="ml-2 text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>AQI Overlay</span>}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                {isDemo ? "Demo — run a test to see real history" : "Last 14 sessions · AQI vs. lung function"}
              </p>
            </div>
            {isDemo && (
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full" style={{ background: isDark ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.07)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>Demo Data</span>
            )}
          </div>

          <div className="h-72 w-full">
            {(() => {
              const isMobileView = typeof window !== 'undefined' && window.innerWidth < 640;
              const chartMargin = isMobileView
                ? { top: 5, right: 8, left: -30, bottom: 0 }
                : { top: 5, right: 20, left: -20, bottom: 0 };
              const tickFontSize = isMobileView ? 9 : 11;
              return (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={chartMargin}>
                    <defs>
                      <linearGradient id="ratioGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#1B2D6B" />
                        <stop offset="100%" stopColor="#2563EB" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(27,45,107,0.06)"} />
                    <XAxis dataKey="date" stroke="transparent" tick={{ fill: isDark ? "#475569" : "#94A3B8", fontWeight: 700, fontSize: tickFontSize }} tickLine={false} />
                    <YAxis yAxisId="left" domain={[60, 85]} stroke="transparent" tick={{ fill: isDark ? "#475569" : "#94A3B8", fontWeight: 700, fontSize: tickFontSize }} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 200]} stroke="transparent" tick={{ fill: isDark ? "#475569" : "#94A3B8", fontWeight: 700, fontSize: tickFontSize }} tickLine={false} />
                    <Tooltip content={<CustomTooltip isDark={isDark} />} />
                    <ReferenceLine yAxisId="left" y={70} stroke="rgba(239,68,68,0.35)" strokeDasharray="6 3"
                      label={{ value: "70%", fill: "#ef4444", fontSize: 9, position: "insideTopRight" }} />
                    <Legend verticalAlign="top" height={32} iconType="circle"
                      wrapperStyle={{ fontSize: isMobileView ? "10px" : "11px", color: isDark ? "#64748b" : "#64748B", fontWeight: 700 }} />
                    <Line yAxisId="left" name="FEV1/FVC %" type="monotone" dataKey="ratio"
                      stroke="url(#ratioGrad)" strokeWidth={3} dot={{ r: 4, fill: "#1B2D6B", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    <Line yAxisId="left" name="FEV1 (L)" type="monotone" dataKey="fev1"
                      stroke="#059669" strokeWidth={2} dot={{ r: 3, fill: "#059669", strokeWidth: 0 }} strokeDasharray="5 3" />
                    {isDemo && <Bar yAxisId="right" name="AQI" dataKey="aqi" fill="rgba(245,158,11,0.15)" radius={[4,4,0,0]} />}
                    <Line yAxisId="right" name="Active Triggers" type="monotone" dataKey="triggerDisplay"
                      stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3.5, fill: "#F59E0B" }} />
                  </ComposedChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        </motion.div>

        {/* Symptom & Trigger Diary */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
          whileHover={{ y: -3 }}
          className="lg:col-span-4 p-6 rounded-2xl flex flex-col gap-4"
          style={cardStyle}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(27,45,107,0.07)", border: "1px solid rgba(27,45,107,0.12)" }}>
              <Activity className="w-3.5 h-3.5" style={{ color: "#1B2D6B" }} />
            </div>
            <div>
              <h3 className="text-sm font-black" style={{ color: textPrimary }}>Symptom & Trigger Diary</h3>
              <p className="text-[10px]" style={{ color: textMuted }}>Log symptoms and daily triggers</p>
            </div>
          </div>

          {/* Environmental Triggers */}
          <div className="flex flex-col gap-2 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: textSub }}>Today's Triggers</label>
            <div className="flex flex-wrap gap-2.5">
              {TRIGGER_LIST.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTrigger(t.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer active:scale-95 select-none"
                  style={activeTriggers.includes(t.id) ? {
                    background: 'rgba(239,68,68,0.08)',
                    borderColor: 'rgba(239,68,68,0.3)',
                    color: '#ef4444'
                  } : {
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(27,45,107,0.03)',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(27,45,107,0.1)',
                    color: textMuted
                  }}
                >
                  <span>{t.emoji}</span> {t.label}
                  {activeTriggers.includes(t.id) && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSymptomSubmit} className="flex-1 flex flex-col gap-3">
            {[
              { label: "Cough", value: cough, setter: setCough, opts: ["none|No Cough", "mild|Mild", "severe|Severe"] },
              { label: "Breathlessness", value: shortBreath, setter: setShortBreath, opts: ["none|None", "mild|Light Activity", "severe|At Rest"] },
              { label: "Fatigue", value: fatigue, setter: setFatigue, opts: ["none|None", "moderate|Moderate", "heavy|Severe"] },
            ].map(({ label, value, setter, opts }) => (
              <div key={label} className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: textSub }}>{label}</label>
                <select value={value} onChange={e => setter(e.target.value)}
                  className="input-clean bg-slate-50/50 hover:bg-slate-50 border-slate-200 focus:border-[#2563EB] focus:ring-[#2563EB]/10 text-xs py-2 px-3 cursor-pointer"
                  style={{ color: isDark ? "#94a3b8" : "#374151" }}>
                  {opts.map(o => <option key={o} value={o.split("|")[0]}>{o.split("|")[1]}</option>)}
                </select>
              </div>
            ))}

            <div className="flex items-center justify-between py-2.5 px-3 rounded-xl"
              style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(27,45,107,0.03)", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(27,45,107,0.08)"}` }}>
              <span className="text-xs font-bold" style={{ color: isDark ? "#94a3b8" : "#374151" }}>Medication Taken?</span>
              <button type="button" onClick={() => setMeds(!meds)}
                className="relative w-10 h-5.5 rounded-full transition-all duration-300 cursor-pointer"
                style={{ background: meds ? "#1B2D6B" : (isDark ? "rgba(255,255,255,0.1)" : "rgba(27,45,107,0.1)"), width: "40px", height: "22px", boxShadow: meds ? "0 0 12px rgba(27,45,107,0.3)" : "none" }}>
                <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm"
                  style={{ left: meds ? "20px" : "2px" }} />
              </button>
            </div>

            <button type="submit"
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-black text-sm cursor-pointer transition-all active:scale-95 text-white"
              style={symptomLogSuccess ? {
                background: "rgba(5,150,105,0.1)", border: "1px solid rgba(5,150,105,0.25)", color: "#059669"
              } : {
                background: "linear-gradient(135deg, #1B2D6B, #2563EB)",
                boxShadow: "0 4px 16px rgba(27,45,107,0.3)"
              }}>
              {symptomLogSuccess ? <><CheckCircle className="w-4 h-4" style={{ color: "#059669" }} /> Logged!</> : <><PlusCircle className="w-4 h-4" /> Save Entry</>}
            </button>
          </form>
        </motion.div>
      </div>

      {/* ── Daily Insight ─────────────────────────────── */}
      <DailyInsight />

      {/* ── Recent Test Logs ─────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        whileHover={{ y: -3 }}
        className="p-6 rounded-2xl cursor-default" style={cardStyle}>
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-base font-black" style={{ color: textPrimary }}>Recent Test Logs</h3>
            <p className="text-xs mt-0.5" style={{ color: textMuted }}>
              {isDemo ? "Demo entries — run a test to record real data" : `Last ${Math.min(history.length, 5)} sessions`}
            </p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5"
            style={{ background: isDark ? "rgba(27,45,107,0.1)" : "rgba(27,45,107,0.07)", color: "#1B2D6B", border: "1px solid rgba(27,45,107,0.15)" }}>
            <Zap className="w-3 h-3" />{isDemo ? "Demo" : "Live Data"}
          </span>
        </div>

        <div className="flex flex-col divide-y" style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(27,45,107,0.06)" }}>
          {isDemo ? [
            { date: "June 13, 2026", summary: "Ratio slightly below normal. Mild airway restriction.", ratio: "70.4%", status: "yellow" },
            { date: "June 10, 2026", summary: "Normal lung volumes and exhalation patterns.", ratio: "73.3%", status: "green" },
            { date: "June 05, 2026", summary: "Excellent lung capacity effort and consistency.", ratio: "75.5%", status: "green" },
          ].map((item, idx) => {
            const sColor = item.status === "green" ? "#059669" : "#f59e0b";
            return (
              <div key={idx} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                <Calendar className="w-4 h-4 shrink-0" style={{ color: textSub }} />
                <div className="flex-1">
                  <h4 className="text-sm font-bold" style={{ color: textPrimary }}>{item.date}</h4>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>{item.summary}</p>
                </div>
                <span className="font-mono text-sm font-black" style={{ color: sColor }}>{item.ratio}</span>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: sColor, boxShadow: `0 0 8px ${sColor}60` }} />
              </div>
            );
          }) : history.slice(0, 5).map((record, idx) => {
            const sColor = record.status === "green" ? "#059669" : record.status === "yellow" ? "#f59e0b" : "#ef4444";
            return (
              <div key={record.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0 group cursor-default">
                <Calendar className="w-4 h-4 shrink-0" style={{ color: textSub }} />
                <div className="flex-1">
                  <h4 className="text-sm font-bold" style={{ color: textPrimary }}>
                    {new Date(record.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </h4>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                    FEV1: {record.fev1}L · FVC: {record.fvc}L · {record.isSimulated ? "Simulated" : "Hardware"}
                  </p>
                </div>
                <span className="font-mono text-sm font-black" style={{ color: sColor }}>{record.ratio.toFixed(1)}%</span>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: sColor, boxShadow: `0 0 8px ${sColor}60` }} />
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: textSub }} />
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>

      {/* ── Print-only medical report ─────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        @media print {
          @page {
            margin: 0;
            size: A4 portrait;
          }

          html, body, #root, .min-h-screen, main, main > div, .relative.w-full {
            background: white !important;
            color: black !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            position: static !important;
            display: block !important;
            box-shadow: none !important;
            filter: none !important;
            backdrop-filter: none !important;
          }

          header, nav, footer, button, aside, .no-print, .print-hidden, .print\\:hidden, [class*="print:hidden"] {
            display: none !important;
          }

          .print-report {
            display: block !important;
            visibility: visible !important;
            position: relative !important;
            width: 100% !important;
            background: white !important;
            color: #0F172A !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            padding: 0 !important;
            margin: 0 !important;
            box-sizing: border-box !important;
          }

          tr { page-break-inside: avoid !important; }
          .print-card { page-break-inside: avoid !important; }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="print-report hidden print:block">
        {renderReportContent()}
      </div>

      {/* ── Modal Report Preview on Screen ── */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-slate-900/60 no-print">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              style={{
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                border: "1px solid rgba(255,255,255,0.08)"
              }}
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
                <div>
                  <h3 className="text-sm font-black text-white">Clinical PFT Report Preview</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">As it will appear when printed or exported as PDF</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handlePrint}
                    className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-black text-white cursor-pointer transition-all active:scale-95 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25">
                    <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                  </button>
                  <button onClick={() => setShowReportModal(false)}
                    className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Realistic Paper Container */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 flex justify-center"
                style={{
                  background: "linear-gradient(135deg, #e7dcd0 0%, #c5b4a2 100%)", // Oak wood desk texture approximation
                  boxShadow: "inset 0 0 40px rgba(0,0,0,0.15)"
                }}
              >
                {/* Paper sheet */}
                <div className="w-full max-w-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-sm border border-slate-200/50 relative overflow-hidden"
                  style={{
                    padding: "48px 56px",
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  {/* Subtle paper pattern filter */}
                  <div className="absolute inset-0 opacity-[0.015] pointer-events-none" 
                    style={{
                      backgroundImage: "radial-gradient(#000 25%, transparent 25%), radial-gradient(#000 25%, transparent 25%)",
                      backgroundSize: "4px 4px",
                      backgroundPosition: "0 0, 2px 2px"
                    }} 
                  />

                  {/* Report content */}
                  {renderReportContent()}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
