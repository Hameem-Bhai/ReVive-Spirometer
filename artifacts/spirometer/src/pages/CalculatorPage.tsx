/**
 * CalculatorPage.tsx — Lung Age Estimator & BMI Calculator
 * Based on: Morris & Temple (1985) lung age formula, WHO BMI classifications
 * Upgraded with: interactive range sliders + SVG circular gauge dials
 */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Wind, Heart, Info, RefreshCw, Sparkles, Activity, FileText, Check, AlertTriangle, Printer } from "lucide-react";
import { loadProfile } from "@/lib/storage";

// ─── Lung Age Formula (Morris & Temple 1985) ──────────────
function calcLungAge(fev1L: number, actualAge: number, sex: "Male" | "Female" | string, heightCm: number): number | null {
  if (!fev1L || !actualAge || !heightCm) return null;
  if (sex === "Male") {
    const lungAge = (0.1070 * heightCm + 4.6477 - fev1L) / 0.5536;
    return Math.max(18, Math.round(lungAge));
  } else {
    const lungAge = (0.0695 * heightCm + 1.5321 - fev1L) / 0.3562;
    return Math.max(18, Math.round(lungAge));
  }
}

function calcBMI(weightKg: number, heightCm: number): number | null {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  return +(weightKg / (h * h)).toFixed(1);
}

function bmiCategory(bmi: number): { label: string; color: string; advice: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "#3B82F6", advice: "Low body weight can weaken respiratory muscles. Consider nutritional support." };
  if (bmi < 25)   return { label: "Normal weight", color: "#059669", advice: "Healthy BMI range. Maintain with regular aerobic exercise for optimal lung function." };
  if (bmi < 30)   return { label: "Overweight", color: "#D97706", advice: "Excess weight increases breathing effort. Moderate exercise & dietary changes are advised." };
  return            { label: "Obese", color: "#EF4444", advice: "Obesity significantly impairs FVC and FEV1. Weight reduction can improve lung capacity by up to 30%." };
}

function lungAgeDiff(lungAge: number, actual: number): { label: string; color: string; icon: string } {
  const diff = lungAge - actual;
  if (diff <= -5) return { label: `${Math.abs(diff)} yrs younger than actual age`, color: "#059669", icon: "🌟" };
  if (diff <= 5)  return { label: "Matches your actual age", color: "#2563EB", icon: "✅" };
  if (diff <= 15) return { label: `${diff} yrs older than actual age — mild obstruction`, color: "#D97706", icon: "⚠️" };
  return               { label: `${diff} yrs older — significant obstruction detected`, color: "#EF4444", icon: "🚨" };
}

// ─── SVG Circular Dial Gauge (Lung Age) ──────────────────
function LungAgeDial({ lungAge, actualAge }: { lungAge: number; actualAge: number }) {
  const result = lungAgeDiff(lungAge, actualAge);
  const minAge = 20;
  const maxAge = 100;
  // Arc from -220deg to +40deg (260deg sweep), 130 radius
  const R = 54;
  const cx = 70;
  const cy = 70;
  const sweepDeg = 240;
  const startAngle = -210; // degrees
  const clampedAge = Math.max(minAge, Math.min(maxAge, lungAge));
  const pct = (clampedAge - minAge) / (maxAge - minAge);
  const needleAngleDeg = startAngle + pct * sweepDeg;
  const toRad = (d: number) => (d * Math.PI) / 180;

  // Compute arc endpoints
  const arcStart = { x: cx + R * Math.cos(toRad(startAngle)), y: cy + R * Math.sin(toRad(startAngle)) };
  const arcEnd   = { x: cx + R * Math.cos(toRad(startAngle + sweepDeg)), y: cy + R * Math.sin(toRad(startAngle + sweepDeg)) };

  // Zone arcs (colored sectors): green 20-40, blue 40-60, orange 60-80, red 80-100
  function describeArc(fromAge: number, toAge: number) {
    const a1 = startAngle + ((fromAge - minAge) / (maxAge - minAge)) * sweepDeg;
    const a2 = startAngle + ((toAge   - minAge) / (maxAge - minAge)) * sweepDeg;
    const p1 = { x: cx + R * Math.cos(toRad(a1)), y: cy + R * Math.sin(toRad(a1)) };
    const p2 = { x: cx + R * Math.cos(toRad(a2)), y: cy + R * Math.sin(toRad(a2)) };
    const large = (a2 - a1) > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${R} ${R} 0 ${large} 1 ${p2.x} ${p2.y}`;
  }

  // Needle tip & base
  const needleLen = R - 8;
  const needleTip  = { x: cx + needleLen * Math.cos(toRad(needleAngleDeg)), y: cy + needleLen * Math.sin(toRad(needleAngleDeg)) };
  const needleBase1 = { x: cx + 5 * Math.cos(toRad(needleAngleDeg + 90)), y: cy + 5 * Math.sin(toRad(needleAngleDeg + 90)) };
  const needleBase2 = { x: cx + 5 * Math.cos(toRad(needleAngleDeg - 90)), y: cy + 5 * Math.sin(toRad(needleAngleDeg - 90)) };

  const zones = [
    { from: 20, to: 45,  color: "#059669" },
    { from: 45, to: 65,  color: "#2563EB" },
    { from: 65, to: 80,  color: "#D97706" },
    { from: 80, to: 100, color: "#EF4444" },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 140 105" width={200} height={150}>
        <defs>
          <linearGradient id="dial-track" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(27,45,107,0.06)" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <path
          d={`M ${arcStart.x} ${arcStart.y} A ${R} ${R} 0 1 1 ${arcEnd.x} ${arcEnd.y}`}
          fill="none" stroke="rgba(27,45,107,0.08)" strokeWidth={10} strokeLinecap="round"
        />

        {/* Color zones */}
        {zones.map(z => (
          <motion.path
            key={z.from}
            d={describeArc(z.from, z.to)}
            fill="none" stroke={z.color} strokeWidth={10} strokeLinecap="round" opacity={0.7}
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: "easeOut" }}
          />
        ))}

        {/* Needle */}
        <motion.polygon
          points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill={result.color}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          style={{ filter: `drop-shadow(0 2px 4px ${result.color}50)` }}
        />
        {/* Hub */}
        <circle cx={cx} cy={cy} r={6} fill="white" stroke={result.color} strokeWidth={2.5} />

        {/* Center label */}
        <text x={cx} y={cy + 22} textAnchor="middle" fontSize={16} fontWeight="900" fill={result.color}>{lungAge}</text>
        <text x={cx} y={cy + 33} textAnchor="middle" fontSize={6.5} fontWeight="700" fill="#94a3b8" letterSpacing={1}>LUNG AGE</text>

        {/* Min/max labels */}
        <text x={arcStart.x - 4} y={arcStart.y + 3} textAnchor="end" fontSize={6} fill="#94a3b8">20</text>
        <text x={arcEnd.x + 4}   y={arcEnd.y + 3}   textAnchor="start" fontSize={6} fill="#94a3b8">100</text>
      </svg>
      <div className="flex items-center gap-2 text-xs font-bold" style={{ color: result.color }}>
        <span>{result.icon}</span>
        <span>Your lungs are {result.label}</span>
      </div>
    </div>
  );
}

// ─── Semi-circular BMI Speedometer Gauge ──────────────────
function BMIGauge({ bmi }: { bmi: number }) {
  const cat = bmiCategory(bmi);
  const R = 56;
  const cx = 80;
  const cy = 80;
  // Semi-circle: left 180 to right 0 (top semicircle), so start at 180deg, sweep 180deg
  const startAngle = 180;
  const sweepDeg   = 180;

  const toRad = (d: number) => (d * Math.PI) / 180;

  // BMI range for gauge: 10 to 45
  const minBMI = 10;
  const maxBMI = 45;
  const clampBMI = Math.max(minBMI, Math.min(maxBMI, bmi));
  const pct = (clampBMI - minBMI) / (maxBMI - minBMI);
  const needleAngleDeg = startAngle + pct * sweepDeg;

  function describeArc(fromBMI: number, toBMI: number) {
    const a1 = startAngle + ((fromBMI - minBMI) / (maxBMI - minBMI)) * sweepDeg;
    const a2 = startAngle + ((toBMI   - minBMI) / (maxBMI - minBMI)) * sweepDeg;
    const p1 = { x: cx + R * Math.cos(toRad(a1)), y: cy + R * Math.sin(toRad(a1)) };
    const p2 = { x: cx + R * Math.cos(toRad(a2)), y: cy + R * Math.sin(toRad(a2)) };
    const large = (a2 - a1) > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${R} ${R} 0 ${large} 1 ${p2.x} ${p2.y}`;
  }

  const needleLen = R - 10;
  const needleTip   = { x: cx + needleLen * Math.cos(toRad(needleAngleDeg)), y: cy + needleLen * Math.sin(toRad(needleAngleDeg)) };
  const needleBase1 = { x: cx + 5 * Math.cos(toRad(needleAngleDeg + 90)), y: cy + 5 * Math.sin(toRad(needleAngleDeg + 90)) };
  const needleBase2 = { x: cx + 5 * Math.cos(toRad(needleAngleDeg - 90)), y: cy + 5 * Math.sin(toRad(needleAngleDeg - 90)) };

  const zones = [
    { from: 10,   to: 18.5, color: "#3B82F6", label: "Under" },
    { from: 18.5, to: 25,   color: "#059669", label: "Normal" },
    { from: 25,   to: 30,   color: "#D97706", label: "Over" },
    { from: 30,   to: 45,   color: "#EF4444", label: "Obese" },
  ];

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 160 100" width={220} height={140}>
        {/* Track */}
        <path
          d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
          fill="none" stroke="rgba(27,45,107,0.07)" strokeWidth={12} strokeLinecap="round"
        />

        {/* Color zones */}
        {zones.map(z => (
          <motion.path
            key={z.from}
            d={describeArc(z.from, z.to)}
            fill="none" stroke={z.color} strokeWidth={12} strokeLinecap="round" opacity={0.75}
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: "easeOut" }}
          />
        ))}

        {/* Zone labels */}
        {zones.map(z => {
          const midBMI = (z.from + z.to) / 2;
          const a = startAngle + ((midBMI - minBMI) / (maxBMI - minBMI)) * sweepDeg;
          const lr = R + 14;
          const lx = cx + lr * Math.cos(toRad(a));
          const ly = cy + lr * Math.sin(toRad(a));
          return (
            <text key={z.label} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fontSize={5.5} fontWeight="800" fill={z.color} opacity={0.9}>{z.label}</text>
          );
        })}

        {/* Needle */}
        <motion.polygon
          points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill={cat.color}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          style={{ filter: `drop-shadow(0 2px 4px ${cat.color}50)` }}
        />
        {/* Hub */}
        <circle cx={cx} cy={cy} r={6} fill="white" stroke={cat.color} strokeWidth={2.5} />

        {/* Center BMI value */}
        <text x={cx} y={cy - 12} textAnchor="middle" fontSize={18} fontWeight="900" fill={cat.color}>{bmi}</text>
        <text x={cx} y={cy - 2}  textAnchor="middle" fontSize={6.5} fontWeight="700" fill="#94a3b8" letterSpacing={1}>BMI</text>
      </svg>

      {/* Category badge */}
      <span className="text-xs font-black px-3 py-1 rounded-full" style={{ background: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}30` }}>
        {cat.label}
      </span>
    </div>
  );
}

// ─── Slider Input Component ───────────────────────────────
function SliderInput({
  label, value, min, max, step, unit, color, onChange
}: {
  label: string; value: number; min: number; max: number; step: number;
  unit: string; color: string; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "#64748B" }}>{label}</label>
        <div className="flex items-baseline gap-0.5">
          <span className="text-lg font-black" style={{ color }}>{value}</span>
          <span className="text-[10px] font-bold text-slate-400 ml-0.5">{unit}</span>
        </div>
      </div>
      <div className="relative h-6 flex items-center">
        {/* Track */}
        <div className="absolute inset-x-0 h-2 rounded-full" style={{ background: "rgba(27,45,107,0.07)" }} />
        {/* Fill */}
        <div className="absolute left-0 h-2 rounded-full transition-all duration-100" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }} />
        {/* Thumb input */}
        <input
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="absolute inset-x-0 w-full opacity-0 cursor-pointer h-6 z-10"
        />
        {/* Custom thumb */}
        <div className="absolute h-5 w-5 rounded-full border-2 pointer-events-none transition-all duration-100 shadow-md"
          style={{ left: `calc(${pct}% - 10px)`, background: "white", borderColor: color, boxShadow: `0 2px 8px ${color}40` }} />
      </div>
      <div className="flex justify-between text-[9px] font-bold text-slate-300">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  const isClinician = localStorage.getItem("revive_clinician_mode") === "true";
  const savedProfile = loadProfile();

  // Clinician GLI-2012 Calculator State
  const [gliSex, setGliSex] = React.useState<"Male" | "Female">("Male");
  const [gliAge, setGliAge] = React.useState<number>(55);
  const [gliHeight, setGliHeight] = React.useState<number>(170);
  const [gliEthnicity, setGliEthnicity] = React.useState<string>("South East Asian");
  const [measuredFev1, setMeasuredFev1] = React.useState<string>("2.10");
  const [measuredFvc, setMeasuredFvc] = React.useState<string>("3.30");

  // Morris & Temple Patient inputs (numeric, for sliders)
  const [fev1,     setFev1]     = React.useState<number>(2.5);
  const [laAge,    setLaAge]    = React.useState<number>(parseInt(savedProfile.age || "35") || 35);
  const [laSex,    setLaSex]    = React.useState<string>(savedProfile.sex || "");
  const [laHeight, setLaHeight] = React.useState<number>(170);
  const [laResult, setLaResult] = React.useState<number | null>(null);

  // BMI inputs
  const [weight,    setWeight]    = React.useState<number>(70);
  const [bmiHeight, setBmiHeight] = React.useState<number>(170);
  const [bmiResult, setBmiResult] = React.useState<number | null>(null);

  const [activeTab, setActiveTab] = React.useState<"lung" | "bmi">("lung");

  const computeLungAge = () => {
    const result = calcLungAge(fev1, laAge, laSex, laHeight);
    setLaResult(result);
  };

  const computeBMI = () => {
    const result = calcBMI(weight, bmiHeight);
    setBmiResult(result);
  };

  const resetLung = () => {
    setFev1(2.5);
    setLaAge(parseInt(savedProfile.age || "35") || 35);
    setLaSex(savedProfile.sex || "");
    setLaHeight(170);
    setLaResult(null);
  };
  const resetBMI = () => { setWeight(70); setBmiHeight(170); setBmiResult(null); };

  const lungResult = laResult && laAge ? lungAgeDiff(laResult, laAge) : null;
  const bmiCat = bmiResult ? bmiCategory(bmiResult) : null;

  // ─── CLINICIAN CALCULATOR MATH ──────────────────────
  const { predFev1, predFvc, predRatio, measFev1, measFvc, fev1Prc, fvcPrc, measRatio, llnFev1, llnFvc, llnRatio, fev1Z, fvcZ, finding, findingColor, stageText } = React.useMemo(() => {
    const ethFactor = 
      gliEthnicity === "African American" ? 0.88 :
      gliEthnicity === "North East Asian" ? 0.94 :
      gliEthnicity === "South East Asian" ? 0.90 : 1.0;

    const predFev1Raw = gliSex === "Male" 
      ? (0.0414 * gliHeight - 0.0244 * gliAge - 2.19)
      : (0.0340 * gliHeight - 0.0224 * gliAge - 1.11);
    const pFev1 = +(predFev1Raw * ethFactor).toFixed(2);

    const predFvcRaw = gliSex === "Male"
      ? (0.0576 * gliHeight - 0.0260 * gliAge - 4.34)
      : (0.0443 * gliHeight - 0.0260 * gliAge - 2.89);
    const pFvc = +(predFvcRaw * ethFactor).toFixed(2);

    const pRatio = +((pFev1 / pFvc) * 100).toFixed(1);

    const mFev1 = parseFloat(measuredFev1) || 0;
    const mFvc = parseFloat(measuredFvc) || 0;

    const fPrc = pFev1 > 0 && mFev1 > 0 ? Math.round((mFev1 / pFev1) * 100) : 0;
    const fvcP = pFvc > 0 && mFvc > 0 ? Math.round((mFvc / pFvc) * 100) : 0;
    const mRatio = mFvc > 0 && mFev1 > 0 ? +((mFev1 / mFvc) * 100).toFixed(1) : 0;

    const fev1SE = 0.38;
    const fvcSE = 0.45;
    const lFev1 = +(pFev1 - 1.645 * fev1SE).toFixed(2);
    const lFvc = +(pFvc - 1.645 * fvcSE).toFixed(2);
    const lRatio = +(pRatio - 10).toFixed(1);

    const fZ = pFev1 > 0 && mFev1 > 0 ? +((mFev1 - pFev1) / fev1SE).toFixed(2) : 0;
    const fvcZScore = pFvc > 0 && mFvc > 0 ? +((mFvc - pFvc) / fvcSE).toFixed(2) : 0;

    let find = "Normal Spirometry";
    let findColor = "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30";
    let stage = "All diagnostic values lie within standard reference equations.";

    if (mRatio > 0) {
      if (mRatio < lRatio || mRatio < 70) {
        find = "Obstructive Ventilatory Defect";
        findColor = "text-red-600 dark:text-red-455 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30";
        if (fPrc >= 80) stage = "GOLD 1 (Mild obstruction) · FEV₁ ≥ 80% Predicted";
        else if (fPrc >= 50) stage = "GOLD 2 (Moderate obstruction) · 50% ≤ FEV₁ < 80% Predicted";
        else if (fPrc >= 30) stage = "GOLD 3 (Severe obstruction) · 30% ≤ FEV₁ < 50% Predicted";
        else stage = "GOLD 4 (Very Severe obstruction) · FEV₁ < 30% Predicted";
      } else if (fvcP < 80 || mFvc < lFvc) {
        find = "Suggestive of Restriction";
        findColor = "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30";
        stage = "Normal ratio, but FVC reduced. TLC plethysmography is required to confirm true restrictive lung defect.";
      }
    }

    return {
      predFev1: pFev1,
      predFvc: pFvc,
      predRatio: pRatio,
      measFev1: mFev1,
      measFvc: mFvc,
      fev1Prc: fPrc,
      fvcPrc: fvcP,
      measRatio: mRatio,
      llnFev1: lFev1,
      llnFvc: lFvc,
      llnRatio: lRatio,
      fev1Z: fZ,
      fvcZ: fvcZScore,
      finding: find,
      findingColor: findColor,
      stageText: stage
    };
  }, [gliSex, gliAge, gliHeight, gliEthnicity, measuredFev1, measuredFvc]);

  if (isClinician) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6 text-left min-h-screen bg-transparent">
        
        {/* Page Header */}
        <div className="flex justify-between items-center border-b pb-4 border-slate-200/60 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-black uppercase text-teal-600 tracking-wider">Clinician Toolbox</span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">Spirometry Reference Calculator</h1>
            <p className="text-xs text-slate-400">Calculate GLI-2012 / ECSC predicted baselines, Z-Scores, and GOLD stages</p>
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
          >
            <Printer className="w-4 h-4" /> Print Results
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Inputs Section */}
          <div className="lg:col-span-5 flex flex-col gap-5 p-5 md:p-6 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm">
            <h2 className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-wider">Demographic Metrics</h2>
            
            {/* Sex Toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Patient Biologic Sex</label>
              <div className="flex gap-2">
                {["Male", "Female"].map(s => (
                  <button
                    key={s}
                    onClick={() => setGliSex(s as any)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                      gliSex === s 
                        ? "bg-[#0f172a] dark:bg-teal-700 text-white border-transparent"
                        : "bg-transparent text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Ethnicity Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Reference Cohort / Ethnicity</label>
              <select
                value={gliEthnicity}
                onChange={(e) => setGliEthnicity(e.target.value)}
                className="px-3.5 py-2 text-xs rounded-xl border outline-none bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
              >
                {["Caucasian", "African American", "North East Asian", "South East Asian", "Other / Mixed"].map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            {/* Sliders */}
            <div className="flex flex-col gap-4 mt-2">
              <SliderInput label="Patient Age" value={gliAge} min={3} max={95} step={1} unit="yrs" color="#14b8a6" onChange={setGliAge} />
              <SliderInput label="Height" value={gliHeight} min={90} max={220} step={1} unit="cm" color="#14b8a6" onChange={setGliHeight} />
            </div>

            {/* Measured Spirometry Logs */}
            <div className="border-t border-slate-100 dark:border-slate-900 pt-4 flex flex-col gap-4">
              <h2 className="text-xs font-black text-[#0f172a] dark:text-white uppercase tracking-wider">Measured Observations</h2>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Measured FEV₁ (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="8.0"
                    value={measuredFev1}
                    onChange={(e) => setMeasuredFev1(e.target.value)}
                    className="px-3.5 py-2 text-xs rounded-xl border outline-none bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Measured FVC (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="9.0"
                    value={measuredFvc}
                    onChange={(e) => setMeasuredFvc(e.target.value)}
                    className="px-3.5 py-2 text-xs rounded-xl border outline-none bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Results Section */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* Diagnostic Alert Card */}
            {measRatio > 0 && (
              <div className={`p-4 rounded-2xl border flex gap-3 items-start transition-all duration-300 ${findingColor}`}>
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider leading-none mb-1.5">Clinical Finding: {finding}</h3>
                  <p className="text-[11px] font-medium leading-relaxed">{stageText}</p>
                </div>
              </div>
            )}

            {/* Calculations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* FEV1 Card */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-4 shadow-sm">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 leading-none">FEV₁ Evaluation</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Forced Expiratory Volume in 1 Second</p>
                </div>

                <div className="flex items-baseline justify-between border-b pb-2 border-slate-100 dark:border-slate-900/60">
                  <span className="text-[11px] text-slate-500 font-bold">Measured:</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white">{measFev1 || "N/A"} L</span>
                </div>
                <div className="flex items-baseline justify-between border-b pb-2 border-slate-100 dark:border-slate-900/60">
                  <span className="text-[11px] text-slate-500 font-bold">Predicted (GLI):</span>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-350">{predFev1} L</span>
                </div>
                <div className="flex items-baseline justify-between border-b pb-2 border-slate-100 dark:border-slate-900/60">
                  <span className="text-[11px] text-slate-500 font-bold">Lower Limit (LLN):</span>
                  <span className="text-xs font-black text-slate-500">{llnFev1} L</span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 block uppercase">% Predicted</span>
                    <span className={`text-xl font-black ${fev1Prc >= 80 ? "text-emerald-500" : fev1Prc >= 50 ? "text-amber-500" : "text-red-500"}`}>{fev1Prc}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 block uppercase">Z-Score</span>
                    <span className={`text-xs font-black ${fev1Z < -1.645 ? "text-red-500" : "text-slate-600 dark:text-slate-300"}`}>{fev1Z}</span>
                  </div>
                </div>
              </div>

              {/* FVC Card */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-4 shadow-sm">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 leading-none">FVC Evaluation</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Forced Vital Capacity</p>
                </div>

                <div className="flex items-baseline justify-between border-b pb-2 border-slate-100 dark:border-slate-900/60">
                  <span className="text-[11px] text-slate-500 font-bold">Measured:</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white">{measFvc || "N/A"} L</span>
                </div>
                <div className="flex items-baseline justify-between border-b pb-2 border-slate-100 dark:border-slate-900/60">
                  <span className="text-[11px] text-slate-500 font-bold">Predicted (GLI):</span>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-350">{predFvc} L</span>
                </div>
                <div className="flex items-baseline justify-between border-b pb-2 border-slate-100 dark:border-slate-900/60">
                  <span className="text-[11px] text-slate-500 font-bold">Lower Limit (LLN):</span>
                  <span className="text-xs font-black text-slate-500">{llnFvc} L</span>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 block uppercase">% Predicted</span>
                    <span className={`text-xl font-black ${fvcPrc >= 80 ? "text-emerald-500" : fvcPrc >= 50 ? "text-amber-500" : "text-red-500"}`}>{fvcPrc}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 block uppercase">Z-Score</span>
                    <span className={`text-xs font-black ${fvcZ < -1.645 ? "text-red-500" : "text-slate-600 dark:text-slate-300"}`}>{fvcZ}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* FEV1/FVC Ratio summary block */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-4 shadow-sm">
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider">FEV₁/FVC Ratio Comparison</h2>
              
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                  <span className="text-[9px] font-black text-slate-400 block uppercase">Measured %</span>
                  <span className="text-base font-black text-slate-850 dark:text-slate-100">{measRatio > 0 ? `${measRatio}%` : "N/A"}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                  <span className="text-[9px] font-black text-slate-400 block uppercase">Predicted %</span>
                  <span className="text-base font-black text-slate-650 dark:text-slate-300">{predRatio}%</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                  <span className="text-[9px] font-black text-slate-400 block uppercase">LLN Threshold</span>
                  <span className="text-base font-black text-red-500">{llnRatio}%</span>
                </div>
              </div>

              {measRatio > 0 && (
                <div className="mt-1">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-1.5">
                    <span>Severe Obstruction (&lt; 50%)</span>
                    <span>LLN ({llnRatio}%)</span>
                    <span>Normal (&gt; 70%)</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden relative border border-slate-200/10">
                    {/* Gradients */}
                    <div className="absolute inset-y-0 left-0 bg-red-500" style={{ width: "50%" }} />
                    <div className="absolute inset-y-0 bg-amber-500" style={{ left: "50%", width: "20%" }} />
                    <div className="absolute inset-y-0 bg-emerald-500" style={{ left: "70%", width: "30%" }} />
                    
                    {/* Measured pointer */}
                    <div className="absolute top-0 bottom-0 w-1.5 bg-slate-950 dark:bg-white border border-slate-200/60 shadow" style={{ left: `${Math.min(100, Math.max(0, measRatio))}%`, transform: "translateX(-50%)" }} />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 text-center">Black pointer indicates patient's measured ratio relative to normal/obstruction zones.</p>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto w-full flex flex-col gap-7 text-[#1B2D6B]">
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[40%] left-[20%] w-[600px] h-[600px] rounded-full bg-[#3B82F6]/5 blur-[120px] dark:bg-[#3B82F6]/2" />
        <div className="absolute -bottom-[30%] right-[10%] w-[500px] h-[500px] rounded-full bg-[#0f766e]/5 blur-[100px] dark:bg-[#0f766e]/2" />
      </div>

      {/* Title */}
      <div className="text-center md:text-left flex flex-col gap-1.5">
        <div className="flex items-center justify-center md:justify-start gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#1B2D6B]/5 dark:bg-white/5 border border-slate-200/30 dark:border-slate-800/30 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Interactive Calculator</h1>
            <p className="text-xs text-slate-400 mt-0.5">Calculate your lung metrics and body health index</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200/30 dark:border-slate-800/30 w-full md:w-80 mx-auto md:mx-0">
        <button
          onClick={() => setActiveTab("lung")}
          className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition ${
            activeTab === "lung"
              ? "bg-white dark:bg-slate-950 text-[#1B2D6B] dark:text-white shadow-md shadow-slate-200/50 dark:shadow-none"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          🫁 Lung Age
        </button>
        <button
          onClick={() => setActiveTab("bmi")}
          className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition ${
            activeTab === "bmi"
              ? "bg-white dark:bg-slate-950 text-[#1B2D6B] dark:text-white shadow-md shadow-slate-200/50 dark:shadow-none"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          ⚖️ BMI
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Lung Age Calculator ────────────────── */}
        {activeTab === "lung" && (
          <motion.div key="lung" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-5"
          >
            <motion.div whileHover={{ y: -3 }} className="p-6 rounded-2xl flex flex-col gap-6 bg-white border border-slate-100 shadow-[0_20px_50px_rgba(27,45,107,0.06)] dark:bg-slate-950 dark:border-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wind className="w-5 h-5 text-[#2563EB]" />
                  <h2 className="font-display font-bold text-[#1B2D6B] dark:text-slate-200 text-lg">Lung Age Estimator</h2>
                </div>
                <button onClick={resetLung} className="text-xs flex items-center gap-1 cursor-pointer transition-colors text-slate-400 hover:text-[#2563EB]">
                  <RefreshCw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>

              {/* Sliders */}
              <div className="flex flex-col gap-5">
                <SliderInput label="Measured FEV₁" value={fev1} min={0.5} max={6.0} step={0.05} unit="L" color="#2563EB" onChange={setFev1} />
                <SliderInput label="Age" value={laAge} min={18} max={95} step={1} unit="yrs" color="#2563EB" onChange={setLaAge} />
                <SliderInput label="Height" value={laHeight} min={120} max={220} step={1} unit="cm" color="#2563EB" onChange={setLaHeight} />
              </div>

              {/* Sex select buttons */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Biological Sex</label>
                <div className="flex gap-2">
                  {["Male", "Female"].map(s => (
                    <button key={s} onClick={() => setLaSex(s)}
                      className="flex-1 py-3 text-xs font-bold border rounded-xl cursor-pointer transition-all active:scale-95"
                      style={laSex === s ? {
                        background: "rgba(37,99,235,0.08)", borderColor: "rgba(37,99,235,0.2)", color: "#2563EB"
                      } : {
                        background: "rgba(27,45,107,0.025)", borderColor: "rgba(27,45,107,0.08)", color: "#64748B"
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={computeLungAge}
                disabled={!laSex}
                className="py-3 rounded-xl font-bold text-sm text-white cursor-pointer transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #1B2D6B, #2563EB)", boxShadow: "0 4px 12px rgba(37,99,235,0.2)" }}>
                Calculate Lung Age
              </button>

              {/* Result with SVG Dial */}
              <AnimatePresence>
                {laResult && lungResult && (
                  <motion.div key="lung-result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 p-6 rounded-2xl"
                    style={{ background: `${lungResult.color}06`, border: `1px solid ${lungResult.color}20` }}>
                    <LungAgeDial lungAge={laResult} actualAge={laAge} />
                    <p className="text-xs text-slate-500 text-center leading-relaxed">
                      Chronological age: <strong className="text-slate-800 dark:text-slate-105">{laAge} years</strong> · Estimated lung age: <strong style={{ color: lungResult.color }}>{laResult} years</strong>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}

        {/* ── BMI Calculator ───────────────────────── */}
        {activeTab === "bmi" && (
          <motion.div key="bmi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-5"
          >
            <motion.div whileHover={{ y: -3 }} className="p-6 rounded-2xl flex flex-col gap-6 bg-white border border-slate-100 shadow-[0_20px_50px_rgba(27,45,107,0.06)] dark:bg-slate-950 dark:border-slate-905">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#059669]" />
                  <h2 className="font-display font-bold text-[#1B2D6B] dark:text-slate-200 text-lg">BMI Calculator</h2>
                </div>
                <button onClick={resetBMI} className="text-xs flex items-center gap-1 cursor-pointer transition-colors text-slate-400 hover:text-[#059669]">
                  <RefreshCw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>

              {/* Sliders */}
              <div className="flex flex-col gap-5">
                <SliderInput label="Weight" value={weight} min={30} max={200} step={0.5} unit="kg" color="#059669" onChange={setWeight} />
                <SliderInput label="Height" value={bmiHeight} min={140} max={210} step={1} unit="cm" color="#0f766e" onChange={setBmiHeight} />
              </div>

              <button onClick={computeBMI}
                className="py-3 rounded-xl font-bold text-sm text-white cursor-pointer transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 4px 12px rgba(16,185,129,0.2)" }}>
                Calculate BMI
              </button>

              {/* Result with Speedometer Gauge */}
              <AnimatePresence>
                {bmiResult && bmiCat && (
                  <motion.div key="bmi-result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 p-6 rounded-2xl"
                    style={{ background: `${bmiCat.color}06`, border: `1px solid ${bmiCat.color}20` }}>
                    <BMIGauge bmi={bmiResult} />
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed max-w-md">{bmiCat.advice}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
