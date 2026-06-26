/**
 * CalculatorPage.tsx — Lung Age Estimator & BMI Calculator
 * Based on: Morris & Temple (1985) lung age formula, WHO BMI classifications
 */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Wind, Heart, Info, RefreshCw, ChevronDown } from "lucide-react";
import { loadProfile } from "@/lib/storage";

// ─── Lung Age Formula (Morris & Temple 1985) ──────────────
function calcLungAge(fev1L: number, actualAge: number, sex: "Male" | "Female" | string, heightCm: number): number | null {
  if (!fev1L || !actualAge || !heightCm) return null;
  const h = heightCm / 100; // convert to meters
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

export default function CalculatorPage() {
  const savedProfile = loadProfile();

  // Lung Age inputs
  const [fev1, setFev1] = React.useState("");
  const [laAge, setLaAge] = React.useState(savedProfile.age || "");
  const [laSex, setLaSex] = React.useState(savedProfile.sex || "");
  const [laHeight, setLaHeight] = React.useState("");
  const [laResult, setLaResult] = React.useState<number | null>(null);

  // BMI inputs
  const [weight, setWeight] = React.useState("");
  const [bmiHeight, setBmiHeight] = React.useState("");
  const [bmiResult, setBmiResult] = React.useState<number | null>(null);

  const [activeTab, setActiveTab] = React.useState<"lung" | "bmi">("lung");

  const computeLungAge = () => {
    const result = calcLungAge(parseFloat(fev1), parseFloat(laAge), laSex, parseFloat(laHeight));
    setLaResult(result);
  };

  const computeBMI = () => {
    const result = calcBMI(parseFloat(weight), parseFloat(bmiHeight));
    setBmiResult(result);
  };

  const resetLung = () => { setFev1(""); setLaAge(savedProfile.age || ""); setLaSex(savedProfile.sex || ""); setLaHeight(""); setLaResult(null); };
  const resetBMI  = () => { setWeight(""); setBmiHeight(""); setBmiResult(null); };

  const lungResult = laResult && laAge ? lungAgeDiff(laResult, parseFloat(laAge)) : null;
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
          { key: "lung" as const, label: "Lung Age Estimator", icon: Wind, color: "#2563EB" },
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
            <motion.div whileHover={{ y: -3 }} className="p-6 rounded-[1.5rem] flex flex-col gap-5 bg-white"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "FEV1 (Liters)", value: fev1, setter: setFev1, placeholder: "e.g. 3.4", type: "number" },
                  { label: "Actual Age (years)", value: laAge, setter: setLaAge, placeholder: "e.g. 34", type: "number" },
                  { label: "Height (cm)", value: laHeight, setter: setLaHeight, placeholder: "e.g. 170", type: "number" },
                ].map(({ label, value, setter, placeholder, type }) => (
                  <div key={label} className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#64748B]">{label}</label>
                    <input 
                      type={type} 
                      placeholder={placeholder} 
                      value={value}
                      onChange={e => setter(e.target.value)} 
                      className="input-clean bg-slate-50/50 hover:bg-slate-50 border-slate-200/80 focus:border-[#2563EB] focus:ring-[#2563EB]/10 text-[#1B2D6B] placeholder-slate-400 text-sm" 
                    />
                  </div>
                ))}

                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#64748B]">Biological Sex</label>
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
              </div>

              <button onClick={computeLungAge}
                disabled={!fev1 || !laAge || !laHeight || !laSex}
                className="py-3 rounded-xl font-bold text-sm text-white cursor-pointer transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #1B2D6B, #2563EB)", boxShadow: "0 4px 12px rgba(37,99,235,0.2)" }}>
                Calculate Lung Age
              </button>

              {/* Result */}
              <AnimatePresence>
                {laResult && lungResult && (
                  <motion.div key="lung-result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-2xl flex flex-col md:flex-row items-center gap-5"
                    style={{ background: `${lungResult.color}08`, border: `1px solid ${lungResult.color}20` }}>
                    <div className="flex flex-col items-center justify-center w-28 h-28 rounded-full shrink-0"
                      style={{ background: "#FFFFFF", border: `2px solid ${lungResult.color}`, boxShadow: `0 8px 20px ${lungResult.color}15` }}>
                      <span className="text-4xl font-display font-black" style={{ color: lungResult.color }}>{laResult}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Lung Age</span>
                    </div>
                    <div className="text-center md:text-left">
                      <p className="text-2xl">{lungResult.icon}</p>
                      <p className="font-black text-[#1B2D6B] text-base mt-1">Your lungs are {lungResult.label}</p>
                      <p className="text-xs mt-1.5 leading-relaxed text-[#64748B]">
                        Chronological age: <strong className="text-[#1B2D6B]">{laAge} years</strong> · Estimated lung age: <strong style={{ color: lungResult.color }}>{laResult} years</strong>
                      </p>
                    </div>
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
            <motion.div whileHover={{ y: -3 }} className="p-6 rounded-2xl flex flex-col gap-5 bg-white border border-slate-100 shadow-[0_20px_50px_rgba(27,45,107,0.06)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5" style={{ color: "#059669" }} />
                  <h2 className="font-display font-bold text-[#1B2D6B] text-lg">BMI Calculator</h2>
                </div>
                <button onClick={resetBMI} className="text-xs flex items-center gap-1 cursor-pointer transition-colors text-slate-400 hover:text-[#059669]">
                  <RefreshCw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Weight (kg)", value: weight, setter: setWeight, placeholder: "e.g. 70" },
                  { label: "Height (cm)", value: bmiHeight, setter: setBmiHeight, placeholder: "e.g. 170" },
                ].map(({ label, value, setter, placeholder }) => (
                  <div key={label} className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#64748B]">{label}</label>
                    <input 
                      type="number" 
                      placeholder={placeholder} 
                      value={value}
                      onChange={e => setter(e.target.value)} 
                      className="input-clean bg-slate-50/50 hover:bg-slate-50 border-slate-200/80 focus:border-[#059669] focus:ring-[#059669]/10 text-[#1B2D6B] placeholder-slate-400 text-sm" 
                    />
                  </div>
                ))}
              </div>

              <button onClick={computeBMI}
                disabled={!weight || !bmiHeight}
                className="py-3 rounded-xl font-bold text-sm text-white cursor-pointer transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 4px 12px rgba(16,185,129,0.2)" }}>
                Calculate BMI
              </button>

              {/* BMI Scale */}
              <div className="flex flex-col gap-2 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">WHO Classification Scale</span>
                <div className="flex rounded-xl overflow-hidden h-2.5">
                  {[
                    { label: "Under", color: "#3B82F6", pct: 20 },
                    { label: "Normal", color: "#059669", pct: 30 },
                    { label: "Over", color: "#D97706", pct: 25 },
                    { label: "Obese", color: "#EF4444", pct: 25 },
                  ].map(s => (
                    <div key={s.label} className="h-full" style={{ width: `${s.pct}%`, background: s.color, opacity: 0.75 }} />
                  ))}
                </div>
                <div className="flex justify-between text-[9px] font-bold text-[#64748B]">
                  <span>&lt;18.5</span><span>18.5</span><span>25</span><span>30</span><span>&gt;40</span>
                </div>
              </div>

              {/* Result */}
              <AnimatePresence>
                {bmiResult && bmiCat && (
                  <motion.div key="bmi-result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-2xl flex flex-col md:flex-row items-center gap-5"
                    style={{ background: `${bmiCat.color}08`, border: `1px solid ${bmiCat.color}20` }}>
                    <div className="flex flex-col items-center justify-center w-28 h-28 rounded-full shrink-0"
                      style={{ background: "#FFFFFF", border: `2px solid ${bmiCat.color}`, boxShadow: `0 8px 20px ${bmiCat.color}15` }}>
                      <span className="text-4xl font-display font-black" style={{ color: bmiCat.color }}>{bmiResult}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">BMI</span>
                    </div>
                    <div className="text-center md:text-left">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: `${bmiCat.color}15`, color: bmiCat.color, border: `1px solid ${bmiCat.color}25` }}>
                        {bmiCat.label}
                      </span>
                      <p className="text-sm mt-2 leading-relaxed text-[#64748B]">{bmiCat.advice}</p>
                    </div>
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
