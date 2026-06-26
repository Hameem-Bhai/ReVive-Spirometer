import React from "react";
import { 
  Users, 
  Search, 
  AlertCircle, 
  TrendingDown, 
  CheckCircle2, 
  Filter, 
  Mail, 
  ChevronRight,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";

// Mock roster of patients
const mockPatients = [
  { id: 1, name: "Yernar Akhmetov", age: 58, location: "Almaty", status: "red", lastTest: "2 hours ago", compliance: "High", ratio: "62.4%", change: "-3.2%" },
  { id: 2, name: "Saniya Omarova", age: 47, location: "Karaganda", status: "yellow", lastTest: "1 day ago", compliance: "Moderate", ratio: "69.1%", change: "-1.5%" },
  { id: 3, name: "Dmitry Morozov", age: 64, location: "Almaty", status: "green", lastTest: "3 hours ago", compliance: "High", ratio: "78.4%", change: "+0.5%" },
  { id: 4, name: "Assem Kadyrova", age: 52, location: "Astana", status: "green", lastTest: "3 days ago", compliance: "Low", ratio: "75.2%", change: "+0.1%" },
  { id: 5, name: "Bakhytzhan Nurgaliev", age: 71, location: "Karaganda", status: "red", lastTest: "1 day ago", compliance: "Moderate", ratio: "58.2%", change: "-4.1%" },
  { id: 6, name: "Irina Petrova", age: 39, location: "Almaty", status: "green", lastTest: "4 hours ago", compliance: "High", ratio: "81.0%", change: "+1.2%" },
];

export default function ClinicianPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const filteredPatients = mockPatients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const redAlertCount = mockPatients.filter(p => p.status === "red").length;
  const yellowAlertCount = mockPatients.filter(p => p.status === "yellow").length;

  return (
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
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
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
        <div className="sm:hidden flex flex-col divide-y divide-slate-100">
          {filteredPatients.map((p) => (
            <div key={p.id} className="p-5 flex flex-col gap-3 text-left">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-800 text-base">{p.name}</h4>
                  <span className="text-xs text-slate-400 block mt-0.5">{p.age} yrs • {p.location}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  p.status === "red" 
                    ? "bg-red-100 text-red-700" 
                    : p.status === "yellow" 
                    ? "bg-amber-100 text-amber-700" 
                    : "bg-emerald-100 text-emerald-700"
                }`}>
                  {p.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-3 text-xs text-slate-500">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">FEV1/FVC</span>
                  <span className="font-mono font-bold text-slate-700">{p.ratio}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Change</span>
                  <span className={p.change.startsWith("-") ? "text-red-500 font-semibold" : "text-emerald-500 font-semibold"}>
                    {p.change}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Last Test</span>
                  <span>{p.lastTest}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
