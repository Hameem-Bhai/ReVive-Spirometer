/**
 * CalculatorPage.tsx — Lung Age Estimator & BMI Calculator
 * Based on: Morris & Temple (1985) lung age formula, WHO BMI classifications
 * Upgraded with: interactive range sliders + SVG circular gauge dials
 */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Wind, Heart, Info, RefreshCw } from "lucide-react";
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
  const savedProfile = loadProfile();

  // Lung Age inputs (numeric, for sliders)
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

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto w-full flex flex-col gap-7 text-[#1B2D6B]">
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-[50%] h-[50%] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent)", filter: "blur(80px)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em] mb-2"
          style={{ color: "#0f766e", background: "rgba(15,118,110,0.07)", border: "1px solid rgba(15,118,110,0.15)", boxShadow: "0 2px 8px rgba(15,118,110,0.08)" }}>
          <Calculator className="w-2.5 h-2.5" /> Health Tools
        </span>
        <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[#1B2D6B]">Calculator</h1>
        <p className="text-sm mt-1.5 text-[#64748B]">Estimate your lung age and body mass index using clinically-based formulas.</p>
      </motion.div>

      {/* Tab Toggle */}
      <div className="flex p-1 gap-1 rounded-2xl relative border border-slate-200"
        style={{ background: "rgba(27,45,107,0.025)" }}>
        {[
          { key: "lung" as const, label: "Lung Age Estimator", icon: Wind,  color: "#2563EB" },
          { key: "bmi"  as const, label: "BMI Calculator",     icon: Heart, color: "#059669" },
        ].map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer relative z-10"
              style={{ color: isActive ? tab.color : "#64748B" }}
            >
              {isActive && (
                <motion.div layoutId="active-calc-tab-pill"
                  className="absolute inset-0 rounded-xl bg-white border border-[rgba(27,45,107,0.08)] shadow-[0_4px_12px_rgba(27,45,107,0.04)] z-[-1]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }} />
              )}
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Lung Age Calculator ──────────────────── */}
        {activeTab === "lung" && (
          <motion.div key="lung" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-5"
          >
            <motion.div whileHover={{ y: -3 }} className="p-6 rounded-[1.5rem] flex flex-col gap-6 bg-white"
              style={{ border: '1px solid rgba(27,45,107,0.07)', boxShadow: '0 2px 4px rgba(27,45,107,0.04), 0 8px 32px rgba(27,45,107,0.07), 0 24px 64px rgba(27,45,107,0.04)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wind className="w-5 h-5" style={{ color: "#2563EB" }} />
                  <h2 className="font-display font-bold text-[#1B2D6B] text-lg">Lung Age Estimator</h2>
                </div>
                <button onClick={resetLung} className="text-xs flex items-center gap-1 cursor-pointer transition-colors text-slate-400 hover:text-[#2563EB]">
                  <RefreshCw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>

              <div className="p-3 rounded-xl flex items-start gap-2.5 bg-[#2563EB]/5 border border-[#2563EB]/10">
                <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#2563EB" }} />
                <p className="text-xs leading-relaxed text-[#1B2D6B]">
                  Based on the <strong>Morris & Temple (1985)</strong> lung age formula using NHANES III reference spirometry values. Enter your <strong>FEV1</strong> from your most recent spirometry test result.
                </p>
              </div>

              {/* Sliders */}
              <div className="flex flex-col gap-5">
                <SliderInput label="FEV1 (Liters)" value={fev1} min={0.5} max={6.0} step={0.1} unit="L" color="#2563EB" onChange={setFev1} />
                <SliderInput label="Actual Age" value={laAge} min={18} max={90} step={1} unit="yr" color="#7c3aed" onChange={setLaAge} />
                <SliderInput label="Height" value={laHeight} min={140} max={210} step={1} unit="cm" color="#0891b2" onChange={setLaHeight} />
              </div>

              {/* Biological sex toggle */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#64748B]">Biological Sex</label>
                <div className="flex gap-2">
                  {["Male", "Female"].map(s => (
                    <button key={s} type="button" onClick={() => setLaSex(s)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all border"
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
                    <p className="text-xs text-center leading-relaxed text-[#64748B]">
                      Chronological age: <strong className="text-[#1B2D6B]">{laAge} years</strong> · Estimated lung age: <strong style={{ color: lungResult.color }}>{laResult} years</strong>
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
            <motion.div whileHover={{ y: -3 }} className="p-6 rounded-2xl flex flex-col gap-6 bg-white border border-slate-100 shadow-[0_20px_50px_rgba(27,45,107,0.06)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5" style={{ color: "#059669" }} />
                  <h2 className="font-display font-bold text-[#1B2D6B] text-lg">BMI Calculator</h2>
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
                    <p className="text-sm text-center leading-relaxed text-[#64748B] max-w-md">{bmiCat.advice}</p>
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
