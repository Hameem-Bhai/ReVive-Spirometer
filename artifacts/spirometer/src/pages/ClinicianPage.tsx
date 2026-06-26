import React from "react";
import { useTheme } from "@/lib/theme";
import {
  Users,
  Search,
  AlertCircle,
  TrendingDown,
  CheckCircle2,
  Filter,
  Mail,
  ChevronRight,
  Clock,
  X,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// Mock roster of patients
const mockPatients = [
  { id: 1, name: "Yernar Akhmetov", age: 58, location: "Almaty", status: "red", lastTest: "2 hours ago", compliance: "High", ratio: "62.4%", change: "-3.2%" },
  { id: 2, name: "Saniya Omarova", age: 47, location: "Karaganda", status: "yellow", lastTest: "1 day ago", compliance: "Moderate", ratio: "69.1%", change: "-1.5%" },
  { id: 3, name: "Dmitry Morozov", age: 64, location: "Almaty", status: "green", lastTest: "3 hours ago", compliance: "High", ratio: "78.4%", change: "+0.5%" },
  { id: 4, name: "Assem Kadyrova", age: 52, location: "Astana", status: "green", lastTest: "3 days ago", compliance: "Low", ratio: "75.2%", change: "+0.1%" },
  { id: 5, name: "Bakhytzhan Nurgaliev", age: 71, location: "Karaganda", status: "red", lastTest: "1 day ago", compliance: "Moderate", ratio: "58.2%", change: "-4.1%" },
  { id: 6, name: "Irina Petrova", age: 39, location: "Almaty", status: "green", lastTest: "4 hours ago", compliance: "High", ratio: "81.0%", change: "+1.2%" },
];

const patientHistory: Record<number, Array<{ date: string; fev1: number; fvc: number; ratio: number }>> = {
  1: [{ date: 'Jan', fev1: 2.8, fvc: 4.5, ratio: 62.2 }, { date: 'Feb', fev1: 2.7, fvc: 4.5, ratio: 60.0 }, { date: 'Mar', fev1: 2.6, fvc: 4.4, ratio: 59.1 }, { date: 'Apr', fev1: 2.5, fvc: 4.3, ratio: 58.1 }, { date: 'May', fev1: 2.6, fvc: 4.4, ratio: 59.0 }, { date: 'Jun', fev1: 2.5, fvc: 4.4, ratio: 62.4 }],
  2: [{ date: 'Jan', fev1: 3.0, fvc: 4.3, ratio: 69.8 }, { date: 'Feb', fev1: 3.1, fvc: 4.4, ratio: 70.5 }, { date: 'Mar', fev1: 3.0, fvc: 4.3, ratio: 69.8 }, { date: 'Apr', fev1: 2.9, fvc: 4.2, ratio: 69.0 }, { date: 'May', fev1: 2.9, fvc: 4.2, ratio: 69.0 }, { date: 'Jun', fev1: 3.0, fvc: 4.3, ratio: 69.1 }],
  3: [{ date: 'Jan', fev1: 3.5, fvc: 4.5, ratio: 77.8 }, { date: 'Feb', fev1: 3.5, fvc: 4.5, ratio: 77.8 }, { date: 'Mar', fev1: 3.6, fvc: 4.6, ratio: 78.3 }, { date: 'Apr', fev1: 3.6, fvc: 4.6, ratio: 78.3 }, { date: 'May', fev1: 3.6, fvc: 4.6, ratio: 78.3 }, { date: 'Jun', fev1: 3.6, fvc: 4.6, ratio: 78.4 }],
  4: [{ date: 'Jan', fev1: 3.4, fvc: 4.5, ratio: 75.6 }, { date: 'Feb', fev1: 3.3, fvc: 4.5, ratio: 73.3 }, { date: 'Mar', fev1: 3.4, fvc: 4.5, ratio: 75.6 }, { date: 'Apr', fev1: 3.4, fvc: 4.5, ratio: 75.6 }, { date: 'May', fev1: 3.4, fvc: 4.5, ratio: 75.6 }, { date: 'Jun', fev1: 3.4, fvc: 4.5, ratio: 75.2 }],
  5: [{ date: 'Jan', fev1: 2.4, fvc: 4.1, ratio: 58.5 }, { date: 'Feb', fev1: 2.3, fvc: 4.0, ratio: 57.5 }, { date: 'Mar', fev1: 2.3, fvc: 4.0, ratio: 57.5 }, { date: 'Apr', fev1: 2.2, fvc: 4.0, ratio: 55.0 }, { date: 'May', fev1: 2.2, fvc: 3.9, ratio: 56.4 }, { date: 'Jun', fev1: 2.3, fvc: 3.9, ratio: 58.2 }],
  6: [{ date: 'Jan', fev1: 3.6, fvc: 4.5, ratio: 80.0 }, { date: 'Feb', fev1: 3.7, fvc: 4.6, ratio: 80.4 }, { date: 'Mar', fev1: 3.7, fvc: 4.6, ratio: 80.4 }, { date: 'Apr', fev1: 3.7, fvc: 4.6, ratio: 80.4 }, { date: 'May', fev1: 3.8, fvc: 4.7, ratio: 80.9 }, { date: 'Jun', fev1: 3.8, fvc: 4.7, ratio: 81.0 }],
};

const getAiInsight = (p: typeof mockPatients[0]) => {
  if (p.status === 'red') return {
    text: `${p.name}'s FEV₁/FVC ratio (${p.ratio}) indicates significant airway obstruction with a ${p.change} trend. Recommend immediate bronchodilator dosage review and clinic visit within 48 hours.`,
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-100'
  };
  if (p.status === 'yellow') return {
    text: `Mild restriction detected in ${p.name.split(' ')[0]} (${p.ratio}, ${p.change}). Suggest checking environmental trigger diary entries and confirming inhaler compliance before next session.`,
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-100'
  };
  return {
    text: `${p.name.split(' ')[0]} shows stable lung function (${p.ratio}, ${p.change}). Maintain current treatment regimen. Schedule 3-month routine review.`,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-100'
  };
};

export default function ClinicianPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [selectedPatientId, setSelectedPatientId] = React.useState<number | null>(null);
  const [notes, setNotes] = React.useState<Record<number, string>>({});
  const [prescription, setPrescription] = React.useState<Record<number, string>>({});

  // Load saved notes and prescriptions from localStorage on mount
  React.useEffect(() => {
    const loadedNotes: Record<number, string> = {};
    const loadedRx: Record<number, string> = {};
    mockPatients.forEach((p) => {
      const n = localStorage.getItem(`revive_notes_${p.id}`);
      const rx = localStorage.getItem(`revive_rx_${p.id}`);
      if (n !== null) loadedNotes[p.id] = n;
      if (rx !== null) loadedRx[p.id] = rx;
    });
    setNotes(loadedNotes);
    setPrescription(loadedRx);
  }, []);

  const saveNote = (id: number, text: string) => {
    const newNotes = { ...notes, [id]: text };
    setNotes(newNotes);
    localStorage.setItem(`revive_notes_${id}`, text);
  };

  const filteredPatients = mockPatients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const redAlertCount = mockPatients.filter(p => p.status === "red").length;
  const yellowAlertCount = mockPatients.filter(p => p.status === "yellow").length;

  return (
    <>
      <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
      
      {/* 🏷️ Page Header */}
      <div>
        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block mb-1">Pulmonologist Portal</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Clinician Monitoring Hub</h1>
      </div>

      {/* 📊 Summary Alert Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-center gap-5 text-left">
          <div className="w-12 h-12 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-md shadow-red-500/10">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">Red Alerts</span>
            <span className="text-3xl font-extrabold text-red-900">{redAlertCount} Patients</span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-center gap-5 text-left">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/10">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Yellow Alerts</span>
            <span className="text-3xl font-extrabold text-amber-900">{yellowAlertCount} Patients</span>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center gap-5 text-left">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/10">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Normal Stable</span>
            <span className="text-3xl font-extrabold text-emerald-900">
              {mockPatients.length - redAlertCount - yellowAlertCount} Patients
            </span>
          </div>
        </div>

      </div>

      {/* 🔍 Search and Filters Bar */}
      <div className="bg-white border border-slate-200/70 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* Search Input */}
        <div className="w-full sm:w-80 relative text-left">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input 
            type="text" 
            placeholder="Search patient or location..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-clean pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 text-sm"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto text-left">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-clean bg-slate-50/50 hover:bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 text-sm py-2.5 px-3 w-full sm:w-auto cursor-pointer"
          >
            <option value="all">All Patients</option>
            <option value="red">Red Alerts Only</option>
            <option value="yellow">Yellow Alerts Only</option>
            <option value="green">Stable Only</option>
          </select>
        </div>

      </div>

      {/* 📑 Patient Grid Table */}
      <div className="bg-white border border-slate-200/70 rounded-3xl shadow-sm overflow-hidden">
        
        {/* Table for PC / Large Screens */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 font-semibold text-slate-500 text-sm">Patient</th>
                <th className="py-4 px-6 font-semibold text-slate-500 text-sm">Age / Location</th>
                <th className="py-4 px-6 font-semibold text-slate-500 text-sm text-center">Status</th>
                <th className="py-4 px-6 font-semibold text-slate-500 text-sm">Last Test Run</th>
                <th className="py-4 px-6 font-semibold text-slate-500 text-sm">FEV₁/FVC Ratio</th>
                <th className="py-4 px-6 font-semibold text-slate-500 text-sm">Change</th>
                <th className="py-4 px-6 font-semibold text-slate-500 text-sm">Compliance</th>
                <th className="py-4 px-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedPatientId(p.id)}>
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-800 text-sm block">{p.name}</span>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500">
                    {p.age} yrs • {p.location}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      p.status === "red" 
                        ? "bg-red-100 text-red-700" 
                        : p.status === "yellow" 
                        ? "bg-amber-100 text-amber-700" 
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500">{p.lastTest}</td>
                  <td className="py-4 px-6 font-mono text-sm font-bold text-slate-700">{p.ratio}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={p.change.startsWith("-") ? "text-red-500 font-semibold" : "text-emerald-500 font-semibold"}>
                      {p.change}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500">{p.compliance}</td>
                  <td className="py-4 px-6 text-right">
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 📱 Stacked Cards for Mobile Viewports */}
        <div className="sm:hidden flex flex-col gap-4 p-4">
          {filteredPatients.map((p) => {
            const statusStyles = p.status === "red"
              ? { bg: "bg-red-50/50 dark:bg-red-950/10", border: "border-red-100 dark:border-red-950/30", text: "text-red-700 dark:text-red-400", pill: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" }
              : p.status === "yellow"
              ? { bg: "bg-amber-50/50 dark:bg-amber-950/10", border: "border-amber-100 dark:border-amber-950/30", text: "text-amber-700 dark:text-amber-400", pill: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" }
              : { bg: "bg-emerald-50/50 dark:bg-emerald-950/10", border: "border-emerald-100 dark:border-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", pill: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" };

            return (
              <motion.div
                key={p.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPatientId(p.id)}
                className={`p-4 rounded-2xl border text-left cursor-pointer flex flex-col gap-3.5 transition-all shadow-[0_2px_8px_rgba(27,45,107,0.02)] ${statusStyles.bg} ${statusStyles.border}`}
                style={{
                  background: isDark ? "rgba(30, 41, 59, 0.25)" : undefined
                }}
              >
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white"
                      style={{
                        background: p.status === 'red' ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : p.status === 'yellow' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#059669,#047857)'
                      }}>
                      {p.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm leading-tight">{p.name}</h4>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{p.age} yrs • {p.location}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${statusStyles.pill}`}>
                    {p.status}
                  </span>
                </div>

                {/* Patient stats */}
                <div className="grid grid-cols-3 gap-2 border-t pt-3" style={{ borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(27,45,107,0.04)" }}>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">FEV1/FVC</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-xs">{p.ratio}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Change</span>
                    <span className={`text-xs font-bold ${p.change.startsWith("-") ? "text-red-500" : "text-emerald-500"}`}>
                      {p.change}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Last Test</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs truncate block">{p.lastTest}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>

    </div>

    {/* SLIDE-OVER PANEL */}
    <AnimatePresence>
      {selectedPatientId !== null && (() => {
        const p = mockPatients.find(x => x.id === selectedPatientId)!;
        const hData = patientHistory[selectedPatientId] || [];
        const insight = getAiInsight(p);
        const currentNotes = notes[selectedPatientId] || '';
        const currentRx = prescription[selectedPatientId] || '';
        return (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              onClick={() => setSelectedPatientId(null)}
            />
            {/* Slide-over panel */}
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed right-0 top-0 h-full w-full md:w-[32rem] bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
              style={{ borderLeft: '1px solid rgba(27,45,107,0.08)' }}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm"
                    style={{ background: p.status === 'red' ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : p.status === 'yellow' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#059669,#047857)' }}>
                    {p.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">{p.name}</h3>
                    <p className="text-xs text-slate-500">{p.age} yrs • {p.location} • Compliance: {p.compliance}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPatientId(null)} className="p-2 hover:bg-slate-200 rounded-full transition">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

                {/* Status Metrics Row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'FEV₁/FVC', value: p.ratio, color: p.status === 'red' ? '#ef4444' : p.status === 'yellow' ? '#f59e0b' : '#059669' },
                    { label: '7-day Change', value: p.change, color: p.change.startsWith('-') ? '#ef4444' : '#059669' },
                    { label: 'Last Test', value: p.lastTest, color: '#64748B' },
                  ].map((m) => (
                    <div key={m.label} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-center">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">{m.label}</p>
                      <p className="text-base font-black" style={{ color: m.color }}>{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Historical FEV1/FVC Chart */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">FEV₁/FVC History (6 Months)</h4>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={hData} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(27,45,107,0.06)" />
                          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                          <YAxis domain={[50, 90]} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', border: '1px solid rgba(27,45,107,0.1)', boxShadow: '0 8px 24px rgba(27,45,107,0.1)' }} />
                          <ReferenceLine y={70} stroke="rgba(239,68,68,0.4)" strokeDasharray="5 3" />
                          <Line type="monotone" dataKey="ratio" name="FEV₁/FVC %" stroke={p.status === 'red' ? '#ef4444' : p.status === 'yellow' ? '#f59e0b' : '#059669'} strokeWidth={2.5} dot={{ r: 3, fill: p.status === 'red' ? '#ef4444' : p.status === 'yellow' ? '#f59e0b' : '#059669' }} />
                          <Line type="monotone" dataKey="fev1" name="FEV₁ (L)" stroke="#2563EB" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 text-center">Red dashed line = 70% clinical threshold</p>
                  </div>
                </div>

                {/* AI Clinical Insight */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">AI Clinical Analysis</h4>
                  <div className={`p-4 rounded-2xl border flex gap-3 items-start ${insight.bg}`}>
                    <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${insight.color}`} />
                    <p className={`text-xs leading-relaxed font-medium ${insight.color}`}>{insight.text}</p>
                  </div>
                </div>

                {/* Clinical Notes */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Clinical Notes</h4>
                  <textarea
                    value={currentNotes}
                    onChange={(e) => {
                      const newNotes = { ...notes, [selectedPatientId]: e.target.value };
                      setNotes(newNotes);
                      localStorage.setItem(`revive_notes_${selectedPatientId}`, e.target.value);
                    }}
                    placeholder="Enter clinical observations, follow-up notes..."
                    rows={4}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-xs resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition bg-slate-50 text-slate-700 placeholder-slate-400"
                  />
                </div>

                {/* Prescription */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Prescription Notes</h4>
                  <input
                    value={currentRx}
                    onChange={(e) => {
                      const newRx = { ...prescription, [selectedPatientId]: e.target.value };
                      setPrescription(newRx);
                      localStorage.setItem(`revive_rx_${selectedPatientId}`, e.target.value);
                    }}
                    placeholder="e.g. Salbutamol 100mcg PRN, Fluticasone 250mcg BD..."
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition bg-slate-50 text-slate-700 placeholder-slate-400"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pb-2">
                  <button className="flex-1 py-3 rounded-2xl text-xs font-black text-white flex items-center justify-center gap-2 transition hover:opacity-90 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #1B2D6B, #2563EB)', boxShadow: '0 4px 16px rgba(27,45,107,0.25)' }}>
                    <Mail className="w-4 h-4" /> Send Referral
                  </button>
                  <button className="flex-1 py-3 rounded-2xl text-xs font-black border border-slate-200 text-slate-600 flex items-center justify-center gap-2 transition hover:bg-slate-50 active:scale-95">
                    <FileText className="w-4 h-4" /> Export Report
                  </button>
                </div>

              </div>
            </motion.div>
          </>
        );
      })()}
    </AnimatePresence>
    </>
  );
}
