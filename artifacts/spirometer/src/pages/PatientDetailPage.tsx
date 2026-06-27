import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useLocation, Link } from "wouter";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Activity,
  Plus,
  Trash2,
  Sparkles,
  Download,
  User,
  MapPin,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  FileText,
  Printer,
  Shield,
  Calendar,
  Lock,
  ChevronRight,
  TrendingUp,
  Briefcase,
  Copy
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

// Shared structures with ClinicianPage
const mockPatients = [
  { id: 1, name: "Yernar Akhmetov", age: 58, sex: "male", location: "Almaty", status: "red", lastTest: "2 hours ago", compliance: "High", ratio: "62.4%", change: "-3.2%" },
  { id: 2, name: "Saniya Omarova", age: 47, sex: "female", location: "Karaganda", status: "yellow", lastTest: "1 day ago", compliance: "Moderate", ratio: "69.1%", change: "-1.5%" },
  { id: 3, name: "Dmitry Morozov", age: 64, sex: "male", location: "Almaty", status: "green", lastTest: "3 hours ago", compliance: "High", ratio: "78.4%", change: "+0.5%" },
  { id: 4, name: "Assem Kadyrova", age: 52, sex: "female", location: "Astana", status: "green", lastTest: "3 days ago", compliance: "Low", ratio: "75.2%", change: "+0.1%" },
  { id: 5, name: "Bakhytzhan Nurgaliev", age: 71, sex: "male", location: "Karaganda", status: "red", lastTest: "1 day ago", compliance: "Moderate", ratio: "58.2%", change: "-4.1%" },
  { id: 6, name: "Irina Petrova", age: 39, sex: "female", location: "Almaty", status: "green", lastTest: "4 hours ago", compliance: "High", ratio: "81.0%", change: "+1.2%" },
];

const defaultPatientHistory: Record<number, Array<{ date: string; fev1: number; fvc: number; ratio: number }>> = {
  1: [{ date: 'Jan', fev1: 2.8, fvc: 4.5, ratio: 62.2 }, { date: 'Feb', fev1: 2.7, fvc: 4.5, ratio: 60.0 }, { date: 'Mar', fev1: 2.6, fvc: 4.4, ratio: 59.1 }, { date: 'Apr', fev1: 2.5, fvc: 4.3, ratio: 58.1 }, { date: 'May', fev1: 2.6, fvc: 4.4, ratio: 59.0 }, { date: 'Jun', fev1: 2.5, fvc: 4.4, ratio: 62.4 }],
  2: [{ date: 'Jan', fev1: 3.0, fvc: 4.3, ratio: 69.8 }, { date: 'Feb', fev1: 3.1, fvc: 4.4, ratio: 70.5 }, { date: 'Mar', fev1: 3.0, fvc: 4.3, ratio: 69.8 }, { date: 'Apr', fev1: 2.9, fvc: 4.2, ratio: 69.0 }, { date: 'May', fev1: 2.9, fvc: 4.2, ratio: 69.0 }, { date: 'Jun', fev1: 3.0, fvc: 4.3, ratio: 69.1 }],
  3: [{ date: 'Jan', fev1: 3.5, fvc: 4.5, ratio: 77.8 }, { date: 'Feb', fev1: 3.5, fvc: 4.5, ratio: 77.8 }, { date: 'Mar', fev1: 3.6, fvc: 4.6, ratio: 78.3 }, { date: 'Apr', stroke: '#14b8a6', fev1: 3.6, fvc: 4.6, ratio: 78.3 }, { date: 'May', fev1: 3.6, fvc: 4.6, ratio: 78.3 }, { date: 'Jun', fev1: 3.6, fvc: 4.6, ratio: 78.4 }],
  4: [{ date: 'Jan', fev1: 3.4, fvc: 4.5, ratio: 75.6 }, { date: 'Feb', fev1: 3.3, fvc: 4.5, ratio: 73.3 }, { date: 'Mar', fev1: 3.4, fvc: 4.5, ratio: 75.6 }, { date: 'Apr', fev1: 3.4, fvc: 4.5, ratio: 75.6 }, { date: 'May', fev1: 3.4, fvc: 4.5, ratio: 75.6 }, { date: 'Jun', fev1: 3.4, fvc: 4.5, ratio: 75.2 }],
  5: [{ date: 'Jan', fev1: 2.4, fvc: 4.1, ratio: 58.5 }, { date: 'Feb', fev1: 2.3, fvc: 4.0, ratio: 57.5 }, { date: 'Mar', fev1: 2.3, fvc: 4.0, ratio: 57.5 }, { date: 'Apr', fev1: 2.2, fvc: 4.0, ratio: 55.0 }, { date: 'May', fev1: 2.2, fvc: 3.9, ratio: 56.4 }, { date: 'Jun', fev1: 2.3, fvc: 3.9, ratio: 58.2 }],
  6: [{ date: 'Jan', fev1: 3.6, fvc: 4.5, ratio: 80.0 }, { date: 'Feb', fev1: 3.7, fvc: 4.6, ratio: 80.4 }, { date: 'Mar', fev1: 3.7, fvc: 4.6, ratio: 80.4 }, { date: 'Apr', fev1: 3.7, fvc: 4.6, ratio: 80.4 }, { date: 'May', fev1: 3.8, fvc: 4.7, ratio: 80.9 }, { date: 'Jun', fev1: 3.8, fvc: 4.7, ratio: 81.0 }],
};

interface Prescription {
  id: string;
  name: string;
  dose: string;
  freq: string;
  date: string;
}

export default function PatientDetailPage({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const { toast } = useToast();
  const isDark = theme === "dark";

  // Escape key handler to return to roster
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLocation("/clinician");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setLocation]);

  // 1. Resolve Patient Data
  const { patient, history } = useMemo(() => {
    if (id === "imported") {
      const params = new URLSearchParams(window.location.search);
      const dataParam = params.get("data") || params.get("import");
      if (dataParam) {
        try {
          const decoded = decodeURIComponent(escape(atob(dataParam)));
          const parsed = JSON.parse(decoded);
          let name = "Shared Record";
          let age = 35;
          let sex = "female";
          let historyArray: any[] = [];
          
          if (parsed && typeof parsed === "object" && "h" in parsed && "p" in parsed) {
            const p = parsed.p;
            name = p[0] || name;
            age = parseInt(p[1]) || age;
            sex = p[2] || sex;
            historyArray = parsed.h;
          } else if (Array.isArray(parsed)) {
            historyArray = parsed;
          }
          
          const mappedHistory = historyArray.map((r: any) => ({
            date: new Date(r[0]).toLocaleDateString("en-US", { month: "short" }),
            fev1: parseFloat(r[1]) || 0,
            fvc: parseFloat(r[2]) || 0,
            ratio: parseFloat(r[3]) || 0,
          }));

          const lastRatio = mappedHistory[mappedHistory.length - 1]?.ratio || 75;
          const status = lastRatio < 60 ? "red" : lastRatio < 70 ? "yellow" : "green";

          return {
            patient: { id: 99, name, age, sex, location: "Imported", status, lastTest: "Just now", compliance: "Unknown", ratio: `${lastRatio}%`, change: "0.0%" },
            history: mappedHistory
          };
        } catch (err) {
          console.error("Failed to parse imported patient in details page:", err);
        }
      }
      return {
        patient: { id: 99, name: "Shared Record", age: 0, sex: "unknown", location: "Unknown", status: "green", lastTest: "N/A", compliance: "N/A", ratio: "0%", change: "0%" },
        history: []
      };
    }

    const patientId = parseInt(id, 10);
    const pObj = mockPatients.find((p) => p.id === patientId) || mockPatients[0];
    const hData = defaultPatientHistory[patientId] || defaultPatientHistory[1];
    return { patient: pObj, history: hData };
  }, [id]);

  // 2. Prescription timeline state
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => {
    const saved = localStorage.getItem(`revive_rx_list_${id}`);
    if (saved) return JSON.parse(saved);
    
    // Default initial prescriptions per patient
    if (id === "1") {
      return [
        { id: "rx-1", name: "Salbutamol", dose: "100mcg", freq: "2 puffs PRN", date: "Jan" },
        { id: "rx-2", name: "Fluticasone", dose: "250mcg", freq: "1 puff BD", date: "Mar" }
      ];
    } else if (id === "5") {
      return [
        { id: "rx-3", name: "Ipratropium", dose: "20mcg", freq: "2 puffs QDS", date: "Feb" }
      ];
    }
    return [];
  });

  const [newMedName, setNewMedName] = useState("");
  const [newMedDose, setNewMedDose] = useState("");
  const [newMedFreq, setNewMedFreq] = useState("");
  const [newMedDate, setNewMedDate] = useState("Jun");

  const handleAddMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim() || !newMedDose.trim()) return;
    const newRx: Prescription = {
      id: `rx-${Date.now()}`,
      name: newMedName,
      dose: newMedDose,
      freq: newMedFreq || "As directed",
      date: newMedDate
    };
    const updated = [...prescriptions, newRx];
    setPrescriptions(updated);
    localStorage.setItem(`revive_rx_list_${id}`, JSON.stringify(updated));
    setNewMedName("");
    setNewMedDose("");
    setNewMedFreq("");
    toast({
      title: "💊 Prescription Added",
      description: `${newRx.name} has been added to timeline.`
    });
  };

  const handleRemoveMed = (medId: string) => {
    const updated = prescriptions.filter(p => p.id !== medId);
    setPrescriptions(updated);
    localStorage.setItem(`revive_rx_list_${id}`, JSON.stringify(updated));
    toast({
      title: "🗑️ Prescription Removed",
      description: "Item removed from timeline."
    });
  };

  // 3. Action Plan Studio State
  const [apGreen, setApGreen] = useState(() => {
    return localStorage.getItem(`revive_ap_green_${id}`) || "Take your maintenance inhaler (Fluticasone) 2 puffs daily in the morning.";
  });
  const [apYellow, setApYellow] = useState(() => {
    return localStorage.getItem(`revive_ap_yellow_${id}`) || "Add reliever inhaler (Salbutamol) 2-4 puffs as needed. Contact clinician if no improvement.";
  });
  const [apRed, setApRed] = useState(() => {
    return localStorage.getItem(`revive_ap_red_${id}`) || "Take 4 puffs of reliever immediately and seek emergency medical services at the hospital.";
  });

  const handleSyncActionPlan = () => {
    localStorage.setItem(`revive_ap_green_${id}`, apGreen);
    localStorage.setItem(`revive_ap_yellow_${id}`, apYellow);
    localStorage.setItem(`revive_ap_red_${id}`, apRed);

    // Sync to patient's personal app view if patient is ID 1 (matches patient profile)
    if (patient.id === 1) {
      localStorage.setItem("revive_action_plan_green", apGreen);
      localStorage.setItem("revive_action_plan_yellow", apYellow);
      localStorage.setItem("revive_action_plan_red", apRed);
      localStorage.setItem("revive_action_plan_synced_at", new Date().toLocaleDateString());
    }

    toast({
      title: "📡 Action Plan Synced!",
      description: `Action plan pushed to ${patient.name}'s mobile dashboard successfully.`
    });
  };

  // 4. Trigger & Symptom Correlation Matrix
  const triggerList = ["Dust", "AQI > 100", "Cold Air", "Exercise", "Pollen"];
  const symptomList = ["FEV₁ Drop > 10%", "Wheezing", "Coughing", "Shortness of Breath"];

  // Mock correlation values matching patient statuses
  const correlations: Record<number, Record<string, Record<string, { value: number; insight: string }>>> = {
    1: { // Yernar (Obstructive Red)
      "FEV₁ Drop > 10%": {
        "Dust": { value: 85, insight: "Dust triggers acute bronchial spasms. Patient shows immediate 15% FEV1 drops within 2 hours of dust logging." },
        "AQI > 100": { value: 90, insight: "Extreme sensitivity to PM2.5 levels. Advise patient to stay indoors during high AQI alerts." },
        "Cold Air": { value: 40, insight: "Moderate constriction when running in cold temperatures. Advise wearing a scarf/mask." },
        "Exercise": { value: 65, insight: "Exercise-induced bronchospasm. Reliever inhaler recommended 15 mins prior to activity." },
        "Pollen": { value: 20, insight: "Minimal allergic airway responses observed during spring pollen logs." }
      },
      "Wheezing": {
        "Dust": { value: 75, insight: "Wheezing reported on 75% of days featuring self-reported dust sweeps." },
        "AQI > 100": { value: 80, insight: "High particulate matter acts as a physical irritant causing persistent wheeze." },
        "Cold Air": { value: 60, insight: "Cold air inhalation causes vocal cord/airway hypersensitivity." },
        "Exercise": { value: 50, insight: "Sustained exertion triggers expiratory wheeze." },
        "Pollen": { value: 15, insight: "No significant correlation to pollen count." }
      }
    },
    5: { // Bakhytzhan (Critical Red)
      "FEV₁ Drop > 10%": {
        "Dust": { value: 60, insight: "Moderate response to dust. Advise regular wet mopping at home." },
        "AQI > 100": { value: 95, insight: "Critical PM2.5 risk. AQI above 100 drops patient into yellow/red zone consistently." },
        "Cold Air": { value: 70, insight: "Strong winter trigger. Advise clinical checkups before winter peaks." },
        "Exercise": { value: 30, insight: "Spirometry drops are primarily environmental, not exertion-based." },
        "Pollen": { value: 40, insight: "Seasonal spring sensitivity to grass pollens." }
      }
    }
  };

  const [activeCell, setActiveCell] = useState<{ symptom: string; trigger: string } | null>({
    symptom: "FEV₁ Drop > 10%",
    trigger: "AQI > 100"
  });

  const cellCorrelation = useMemo(() => {
    if (!activeCell) return null;
    const patId = patient.id === 99 ? 1 : patient.id; // Fallback to patient 1 for mock correlations
    const data = correlations[patId] || correlations[1];
    return data[activeCell.symptom]?.[activeCell.trigger] || { value: 15, insight: "No significant clinical correlation detected in daily logs." };
  }, [activeCell, patient.id]);

  // 5. AI Clinical Assistant State
  const [aiDocType, setAiDocType] = useState<"referral" | "discharge" | "adjustment">("referral");
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const generateReport = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      let doc = "";
      const latestRxText = prescriptions.map(p => `${p.name} ${p.dose} (${p.freq})`).join(", ") || "None";
      
      if (aiDocType === "referral") {
        doc = `CLINICAL REFERRAL LETTER
Date: ${new Date().toLocaleDateString()}
To: Department of Pulmonology, Specialist Medical Center

RE: Clinical Assessment and Referral for ${patient.name} (Age: ${patient.age}, Sex: ${patient.sex})

Dear Doctor,

I am writing to refer ${patient.name} for comprehensive diagnostic review and specialized therapeutic management. 

Our clinic has monitored this patient using ReVive home-spirometry. The patient's latest FEV₁/FVC ratio is logged at ${patient.ratio}, which represents a ${patient.change} trend over the last month, placing them in the clinical ${patient.status.toUpperCase()} zone. 

Current medication regimen: ${latestRxText}.
Key observations: The correlation matrix indicates extreme airway hyper-responsiveness to environmental triggers (specifically AQI/Dust).

Given the obstructive pattern and trend, I would appreciate your expert consultation regarding stepping up therapy.

Sincerely,
Attending Pulmonologist
ReVive Diagnostics Portal Bangladesh`;
      } else if (aiDocType === "discharge") {
        doc = `CLINICAL DISCHARGE SUMMARY
Date: ${new Date().toLocaleDateString()}
Patient Name: ${patient.name}
Age: ${patient.age} | Sex: ${patient.sex}

DIAGNOSIS: Chronic Airway Obstruction / Moderate Asthma

HOSPITAL COURSE: 
Patient was monitored over 6 months using home spirometric sweeps. Peak FEV₁ reached 3.1L, with a baseline FEV₁/FVC ratio averaging ${patient.ratio}. Therapeutic interventions included monitoring compliance, which is currently graded as "${patient.compliance}".

DISCHARGE RECOMMENDATIONS & MEDICATIONS:
1. Maintain active prescription: ${latestRxText}.
2. Patient has synced Asthma Action Plan for Green/Yellow/Red zone thresholds.
3. Keep daily environmental sweeps. Next follow-up in 3 months.

Sign: ___________________
MD, Lead Pulmonologist`;
      } else {
        doc = `AI TREATMENT ADJUSTMENT SUGGESTIONS
Patient: ${patient.name} (FEV₁/FVC: ${patient.ratio}, Status: ${patient.status.toUpperCase()})

Based on clinical trends and trigger logs, the following adjustment options are suggested:

1. STEP-UP THERAPY PLAN (Obstructive Trend):
   - Due to the recent ${patient.change} drop in FEV₁/FVC, consider transitioning from Fluticasone to a combination ICS/LABA (e.g. Symbicort/Budacort 200mcg 2 puffs BD).
   
2. ENVIRONMENTAL INTERVENTION:
   - High correlation detected with AQI > 100. Recommend adding Montelukast 10mg OD in the evening to reduce ambient particulate airway triggers.
   
3. COMPLIANCE BOOST:
   - Compliance is currently "${patient.compliance}". Recommend enabling daily browser push notifications via settings for regular morning testing.`;
      }
      setGeneratedDoc(doc);
      setIsAiLoading(false);
      toast({
        title: "✨ Document Generated",
        description: "AI assistant completed the draft report."
      });
    }, 900);
  };

  // Generate initial report on mount or when doc type changes
  useEffect(() => {
    generateReport();
  }, [aiDocType]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedDoc);
    toast({
      title: "📋 Copied to Clipboard",
      description: "The clinical report text has been copied."
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 text-left min-h-screen bg-transparent">
      
      {/* ── HEADER NAVIGATION ────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-4">
          <Link href="/clinician">
            <span className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-all active:scale-90 flex items-center justify-center bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300">
              <ArrowLeft className="w-4 h-4" />
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-black text-base shadow-sm">
              {patient.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-[#0f172a] dark:text-white leading-none">{patient.name}</h1>
                <span className={`w-2.5 h-2.5 rounded-full relative flex`}>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    patient.status === "red" ? "bg-red-400" : patient.status === "yellow" ? "bg-amber-400" : "bg-emerald-400"
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    patient.status === "red" ? "bg-red-500" : patient.status === "yellow" ? "bg-amber-500" : "bg-emerald-500"
                  }`}></span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">
                {patient.age} yrs • {patient.sex} • {patient.location}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => window.print()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition"
          >
            <Printer className="w-4 h-4" /> Print Record
          </button>
          <span className="text-[10px] font-black uppercase text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 px-3 py-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/10">
            ID: {patient.id}
          </span>
        </div>
      </div>

      {/* ── PATIENT METRIC QUICK GRID ────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "FEV₁/FVC Ratio", value: patient.ratio, sub: "Last sweep", color: patient.status === "red" ? "text-red-500" : patient.status === "yellow" ? "text-amber-500" : "text-emerald-500" },
          { label: "30-day Change", value: patient.change, sub: "Recent trend", color: patient.change.startsWith("-") ? "text-red-500" : "text-emerald-500" },
          { label: "Last Active", value: patient.lastTest, sub: "Time since sweep", color: "text-[#0f172a] dark:text-white" },
          { label: "Compliance Rate", value: patient.compliance, sub: "Test frequency", color: patient.compliance === "High" ? "text-emerald-500" : patient.compliance === "Moderate" ? "text-amber-500" : "text-red-500" },
        ].map((m, idx) => (
          <div key={idx} className="p-4 rounded-2xl card-premium border border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-1.5 bg-white dark:bg-slate-950 shadow-sm">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{m.label}</span>
            <span className={`text-xl font-black ${m.color}`}>{m.value}</span>
            <span className="text-[10px] text-slate-400 leading-none">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENTS GRID ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column (Recharts Graph & Prescriptions) ── */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Spirometry Trend Chart */}
          <div className="p-5 md:p-6 rounded-3xl card-premium border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-[#0f172a] dark:text-white">Lung Function History</h2>
                <p className="text-xs text-slate-400 mt-0.5">PEF, FEV₁/FVC %, and prescription alignment timeline</p>
              </div>
              <span className="flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 text-teal-600 dark:text-teal-400 uppercase">
                <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Graph
              </span>
            </div>

            <div className="h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,23,42,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '16px', fontSize: '11px', border: '1px solid rgba(15,23,42,0.06)', background: isDark ? '#0f172a' : '#ffffff', boxShadow: '0 8px 32px rgba(15,23,42,0.08)' }} />
                  <ReferenceLine y={70} stroke="rgba(239,68,68,0.4)" strokeDasharray="5 3" />
                  
                  {/* Vertical markers showing medication additions */}
                  {prescriptions.map((rx) => (
                    <ReferenceLine
                      key={rx.id}
                      x={rx.date}
                      stroke="#14b8a6"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      label={{ value: `+${rx.name}`, fill: '#0f766e', fontSize: 9, fontWeight: 900, position: 'top' }}
                    />
                  ))}

                  <Line type="monotone" dataKey="ratio" name="FEV₁/FVC %" stroke={patient.status === 'red' ? '#ef4444' : patient.status === 'yellow' ? '#f59e0b' : '#14b8a6'} strokeWidth={3} dot={{ r: 4, fill: patient.status === 'red' ? '#ef4444' : patient.status === 'yellow' ? '#f59e0b' : '#14b8a6' }} />
                  <Line type="monotone" dataKey="fev1" name="FEV₁ (L)" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 text-center">Red line = 70% obstruction threshold. Vertical green lines indicate medication updates.</p>
          </div>

          {/* Smart Prescription Manager */}
          <div className="p-5 md:p-6 rounded-3xl card-premium border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 flex flex-col gap-5 shadow-sm">
            <div>
              <h2 className="text-base font-black text-[#0f172a] dark:text-white">Active Prescriptions & Timeline</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage pharmacotherapy and track timelines against lung performance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              {/* Prescription list */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Regimen</span>
                {prescriptions.length === 0 ? (
                  <div className="p-6 text-center border border-dashed rounded-2xl bg-slate-50/50 dark:bg-slate-900/10">
                    <p className="text-xs text-slate-400">No active medications logged on this profile.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {prescriptions.map((rx) => (
                      <div key={rx.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs font-bold">
                            Rx
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white">{rx.name}</h4>
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-200/40 dark:bg-slate-800 px-1.5 py-0.5 rounded-full uppercase">{rx.date}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">{rx.dose} • {rx.freq}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMed(rx.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add prescription form */}
              <form onSubmit={handleAddMed} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Add Medication</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold uppercase text-slate-400">Drug Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Symbicort"
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-xl border outline-none bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold uppercase text-slate-400">Dosage</label>
                    <input
                      type="text"
                      placeholder="e.g. 160mcg"
                      value={newMedDose}
                      onChange={(e) => setNewMedDose(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-xl border outline-none bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold uppercase text-slate-400">Frequency</label>
                    <input
                      type="text"
                      placeholder="e.g. 2 puffs BD"
                      value={newMedFreq}
                      onChange={(e) => setNewMedFreq(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-xl border outline-none bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold uppercase text-slate-400">Date Logged</label>
                    <select
                      value={newMedDate}
                      onChange={(e) => setNewMedDate(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-xl border outline-none bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                    >
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-2 mt-1 rounded-xl text-xs font-bold text-white transition hover:opacity-90 bg-teal-600 dark:bg-teal-700 shadow"
                >
                  Add Rx Timeline Event
                </button>
              </form>
            </div>
          </div>

          {/* Trigger & Symptom Correlation Matrix */}
          <div className="p-5 md:p-6 rounded-3xl card-premium border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 flex flex-col gap-4 shadow-sm">
            <div>
              <h2 className="text-base font-black text-[#0f172a] dark:text-white">Trigger & Symptom Correlation Heatmap</h2>
              <p className="text-xs text-slate-400 mt-0.5">Examine the statistical link between environmental exposures and lung capacity drops</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Matrix grid */}
              <div className="md:col-span-8 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-[9px] font-black uppercase text-slate-400">Symptom</th>
                      {triggerList.map((t) => (
                        <th key={t} className="p-2 text-[9px] font-black uppercase text-slate-400 text-center">{t}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {symptomList.map((s) => (
                      <tr key={s} className="border-t border-slate-100 dark:border-slate-900/60">
                        <td className="p-2 text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">{s}</td>
                        {triggerList.map((t) => {
                          const patId = patient.id === 99 ? 1 : patient.id;
                          const data = correlations[patId] || correlations[1];
                          const score = data[s]?.[t]?.value || 15;
                          
                          // Determine heatmap color style
                          let bg = "bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400";
                          if (score > 80) bg = "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold border border-red-200/40";
                          else if (score > 55) bg = "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-bold";

                          const isActive = activeCell?.symptom === s && activeCell?.trigger === t;

                          return (
                            <td key={t} className="p-1.5 text-center">
                              <button
                                onClick={() => setActiveCell({ symptom: s, trigger: t })}
                                className={`w-11 h-8 rounded-xl text-xs flex items-center justify-center mx-auto transition-all ${bg} ${
                                  isActive ? "ring-2 ring-teal-500 scale-105 shadow-sm" : "hover:opacity-80"
                                }`}
                              >
                                {score}%
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Matrix clinical insight detail */}
              <div className="md:col-span-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col gap-2 min-h-[170px]">
                {activeCell ? (
                  <>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      {activeCell.trigger} ➔ {activeCell.symptom}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-black ${
                        cellCorrelation!.value > 80 ? "text-red-500" : cellCorrelation!.value > 55 ? "text-amber-500" : "text-teal-500"
                      }`}>
                        {cellCorrelation!.value}% Correlation
                      </span>
                      <span className="text-[8px] font-bold uppercase tracking-wider bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-full border">
                        {cellCorrelation!.value > 80 ? "Critical Trigger" : cellCorrelation!.value > 55 ? "Moderate risk" : "Low risk"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                      {cellCorrelation!.insight}
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center py-6">
                    <AlertCircle className="w-6 h-6 mb-2 opacity-50" />
                    <p className="text-xs">Click a heatmap cell to read clinical insights.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ── Right Column (AI Assistant & Action Plan Studio) ── */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* AI Clinical Assistant Panel */}
          <div className="p-5 md:p-6 rounded-3xl card-premium border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 flex flex-col gap-4 shadow-sm">
            <div>
              <h2 className="text-base font-black text-[#0f172a] dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 animate-pulse" /> AI Clinical Assistant
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Generate referrals, progress reports, or treatment reviews</p>
            </div>

            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200/20">
              {[
                { id: "referral", label: "Referral" },
                { id: "discharge", label: "Discharge" },
                { id: "adjustment", label: "Suggestions" }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setAiDocType(opt.id as any)}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                    aiDocType === opt.id
                      ? "bg-white dark:bg-slate-950 text-[#0f172a] dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="relative">
              {isAiLoading ? (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10 rounded-2xl">
                  <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Drafting Document...</span>
                </div>
              ) : null}

              <textarea
                value={generatedDoc}
                onChange={(e) => setGeneratedDoc(e.target.value)}
                rows={11}
                className="w-full text-xs p-3.5 border border-slate-200 dark:border-slate-800/80 rounded-2xl resize-none focus:outline-none bg-slate-50 dark:bg-slate-900/50 font-mono text-slate-700 dark:text-slate-300"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center justify-center gap-2 transition"
              >
                <Copy className="w-4 h-4" /> Copy Draft
              </button>
              <button
                onClick={generateReport}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 transition"
                title="Regenerate Draft"
              >
                🔄
              </button>
            </div>
          </div>

          {/* Action Plan Studio */}
          <div className="p-5 md:p-6 rounded-3xl card-premium border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 flex flex-col gap-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-black text-[#0f172a] dark:text-white">Action Plan Studio</h2>
                <p className="text-xs text-slate-400 mt-0.5">Customize thresholds and sync instructions to patient</p>
              </div>
              <Lock className="w-4 h-4 text-slate-400" title="Clinical Sync Locked to Profile" />
            </div>

            <div className="flex flex-col gap-3">
              {/* Green Zone */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase text-emerald-600 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Green Zone (FEV₁/PEF &gt; 80%)
                </span>
                <textarea
                  value={apGreen}
                  onChange={(e) => setApGreen(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800/80 rounded-xl resize-none focus:outline-none bg-slate-50 dark:bg-slate-900/50"
                  placeholder="Green zone protocol..."
                />
              </div>

              {/* Yellow Zone */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase text-amber-600 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Yellow Zone (FEV₁/PEF 50-80%)
                </span>
                <textarea
                  value={apYellow}
                  onChange={(e) => setApYellow(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800/80 rounded-xl resize-none focus:outline-none bg-slate-50 dark:bg-slate-900/50"
                  placeholder="Yellow zone protocol..."
                />
              </div>

              {/* Red Zone */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase text-red-500 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Red Zone (FEV₁/PEF &lt; 50%)
                </span>
                <textarea
                  value={apRed}
                  onChange={(e) => setApRed(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800/80 rounded-xl resize-none focus:outline-none bg-slate-50 dark:bg-slate-900/50"
                  placeholder="Critical Red zone instructions..."
                />
              </div>
            </div>

            <button
              onClick={handleSyncActionPlan}
              className="py-3 mt-1 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 transition hover:opacity-90 active:scale-95 shadow-lg bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-700 dark:to-emerald-700"
            >
              Sync Plan to Patient App
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
