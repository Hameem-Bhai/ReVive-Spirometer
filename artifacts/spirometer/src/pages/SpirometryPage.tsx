import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Activity, Play, ArrowRight, Usb, RefreshCw, FileText, Wind, Volume2, VolumeX, Vibrate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAnalyzeSpirometer } from "@workspace/api-client-react";
import { SpiroRound, SpiroAnalysis } from "@workspace/api-zod";
import { saveTestRecord, loadProfile, classifyRatio } from "@/lib/storage";

// ─── Haptic Feedback ──────────────────────────────────────
const vibrate = (pattern: number | number[]) => {
  if ("vibrate" in navigator) {
    try { navigator.vibrate(pattern); } catch {}
  }
};

// ─── Voice Guidance ───────────────────────────────────────
const speak = (text: string, voiceEnabled: boolean) => {
  if (!voiceEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.9;
  utt.pitch = 1.0;
  utt.volume = 1.0;
  window.speechSynthesis.speak(utt);
};

type Stage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// ─── Balloon Mini-Game ────────────────────────────────────
function BalloonGame({ pressure, phase }: { pressure: number; phase: string }) {
  const pct = Math.min(1, pressure / 800); // 0 to 1
  const size = 60 + pct * 120; // 60px → 180px
  const r = size / 2;
  const isPopped = pct >= 0.98;
  const color = isPopped
    ? "#ef4444"
    : pct > 0.7 ? `hsl(${30 + pct * 30}, 90%, 55%)` : `hsl(${220 - pct * 60}, 80%, 60%)`;

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-4">
      <AnimatePresence mode="wait">
        {isPopped ? (
          <motion.div key="popped" initial={{ scale: 1.4, opacity: 1 }} animate={{ scale: 3, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
            className="text-6xl">💥</motion.div>
        ) : (
          <motion.div key="balloon"
            animate={{ width: size, height: size * 1.15 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative flex items-center justify-center rounded-full"
            style={{
              background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5), ${color})`,
              boxShadow: `0 8px 32px ${color}60, inset 0 -8px 20px rgba(0,0,0,0.15)`,
              borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
            }}>
            {/* Shine */}
            <div className="absolute top-[20%] left-[28%] w-[20%] h-[15%] bg-white opacity-60 rounded-full" />
            {/* String */}
            <motion.div className="absolute -bottom-8 w-0.5 h-8" style={{ background: color, originY: 0, marginLeft: "50%" }}
              animate={{ rotate: [0, 3, -3, 0] }} transition={{ repeat: Infinity, duration: 2 }} />
          </motion.div>
        )}
      </AnimatePresence>
      <p className="text-xs font-bold" style={{ color: color }}>
        {isPopped ? "Great effort! 💨" : phase === "out" ? `Blow! ${Math.round(pct * 100)}% full` : "Inhale deeply…"}
      </p>
    </div>
  );
}


export default function SpirometryPage() {
  const [stage, setStage] = useState<Stage>(1);
  const [roundsTotal, setRoundsTotal] = useState<number>(3);
  
  const savedProfile = loadProfile();
  const [age, setAge] = useState<string>(savedProfile.age || "");
  const [sex, setSex] = useState<string>(savedProfile.sex || "");
  
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // ── New feature states ──
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);
  const [practiceComplete, setPracticeComplete] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return localStorage.getItem("revive_onboarded") !== "true";
  });

  const [currentRound, setCurrentRound] = useState<number>(1);
  const [phase, setPhase] = useState<'in' | 'out' | 'done'>('in');
  const [countdown, setCountdown] = useState<number>(5);
  
  const [livePressure, setLivePressure] = useState<number>(0);
  const [roundsData, setRoundsData] = useState<SpiroRound[]>([]);
  
  const [analysisResult, setAnalysisResult] = useState<SpiroAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const analyzeMutation = useAnalyzeSpirometer();

  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const readingIntervalRef = useRef<number | null>(null);
  const rawReadingsRef = useRef<number[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const cleanupSerial = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current.releaseLock();
        readerRef.current = null;
      }
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
    } catch (err) {
      // Ignore errors during cleanup — port may already be closed
    }
  };

  const connectSerial = async () => {
    try {
      if (!("serial" in navigator)) {
        setConnectError("Web Serial API not supported. Please use Chrome or Edge.");
        return;
      }
      // Release any previous connection before opening a new one
      await cleanupSerial();
      setIsConnecting(true);
      setConnectError(null);
      // No port filter — shows all ports including cu.usbserial-* devices
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;

      const reader = port.readable.pipeThrough(new TextDecoderStream()).getReader();
      readerRef.current = reader;

      setIsConnected(true);
      setIsSimulated(false);
      setIsConnecting(false);

      // Start background reader
      readLoop(reader);
    } catch (err: any) {
      setIsConnecting(false);
      const msg: string = err?.message ?? String(err);
      // User cancelled the picker — don't show an error
      if (err?.name === "NotFoundError" || msg.includes("No port selected")) return;
      // Port already open (e.g. Arduino IDE Serial Monitor is holding it)
      if (msg.toLowerCase().includes("failed to open") || msg.toLowerCase().includes("already open")) {
        setConnectError("Port is busy. Try again.");
      } else {
        setConnectError(`Could not open port: ${msg}`);
      }
    }
  };

  const readLoop = async (reader: any) => {
    let buffer = "";
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          // Keep any incomplete trailing line in the buffer
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Arduino format: "Raw: 1234 | Voltage: 1.23V | Pressure: 0.45 kPa"
            const pressureMatch = trimmed.match(/Pressure:\s*([-\d.]+)/i);
            const num = pressureMatch
              ? parseFloat(pressureMatch[1])
              : parseFloat(trimmed); // fallback for plain-float firmware

            if (!isNaN(num)) {
              setLivePressure(num);
              // Only collect readings during the exhale phase
              if (phaseRef.current === 'out') {
                rawReadingsRef.current.push(num);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Read loop error:", error);
    }
  };

  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startSimulation = useCallback(() => {
    let t = 0;
    simIntervalRef.current = setInterval(() => {
      t += 0.2;
      // Simulated exhalation curve (starts high, drops off)
      const noise = (Math.random() - 0.5) * 50;
      let val = 200 + noise;
      if (phase === 'out') {
        const flow = Math.max(0, 600 * Math.exp(-t/2) * Math.sin(t*2));
        val += flow;
      } else if (phase === 'in') {
         val -= 50;
      }
      setLivePressure(Math.round(val));
      if (phase === 'out') {
        rawReadingsRef.current.push(Math.round(val));
      }
    }, 200);
  }, [phase]);

  const stopSimulation = () => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (isSimulated && stage === 6) {
      startSimulation();
    } else {
      stopSimulation();
    }
    return stopSimulation;
  }, [isSimulated, stage, phase, startSimulation]);

  // When using real hardware, reset live pressure to 0.0 on every phase change
  // so the display stays at 0.0 until the sensor actually sends a new reading
  useEffect(() => {
    if (!isSimulated && isConnected) {
      setLivePressure(0);
    }
  }, [phase, isSimulated, isConnected]);

  // Timer logic for Stage 6 (with haptics + voice)
  useEffect(() => {
    if (stage === 6) {
      if (phase === 'in') {
        speak("Take a deep breath in. Inhale now.", voiceEnabled);
        vibrate([100, 80, 100, 80, 100]); // triple pulse = inhale cue
        setCountdown(5);
        countdownIntervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
              speak("Now exhale — blow out as hard and fast as you can!", voiceEnabled);
              vibrate(300); // solid buzz = exhale
              setPhase('out');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else if (phase === 'out') {
        setCountdown(5);
        countdownIntervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
              finishRound();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else if (phase === 'done') {
        if (currentRound < roundsTotal) {
          speak(`Round ${currentRound} complete. Rest for 3 seconds.`, voiceEnabled);
          vibrate([200, 100, 200]); // double buzz = round done
          setCountdown(3);
          countdownIntervalRef.current = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                setCurrentRound(prevRound => prevRound + 1);
                setPhase('in');
                rawReadingsRef.current = [];
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          // All rounds done
          speak("Excellent! All rounds complete. Analyzing your results.", voiceEnabled);
          vibrate([100, 50, 100, 50, 500]); // completion pattern
          setTimeout(() => {
            setStage(7);
          }, 1500);
        }
      }

    }
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [stage, phase, currentRound, roundsTotal]);

  const finishRound = () => {
    const readings = [...rawReadingsRef.current];
    if (readings.length === 0) readings.push(0);
    
    const peak = Math.max(...readings);
    const min = Math.min(...readings);
    const avg = readings.reduce((a, b) => a + b, 0) / readings.length;
    
    const roundData: SpiroRound = {
      roundNumber: currentRound,
      peakPressure: peak,
      avgPressure: avg,
      minPressure: min,
      maxPressure: peak,
      rawReadings: readings,
      durationSeconds: 5
    };
    
    setRoundsData(prev => [...prev, roundData]);
    setPhase('done');
  };

  useEffect(() => {
    if (stage === 7) {
      // Execute API call
      analyzeMutation.mutate({
        data: {
          age: age ? parseInt(age) : null,
          sex: sex || null,
          rounds: roundsData
        }
      }, {
        onSuccess: (data) => {
          setAnalysisResult(data);
          // Save result to localStorage history
          if (data && roundsData.length > 0) {
            const bestRound = roundsData.reduce((a, b) => b.peakPressure > a.peakPressure ? b : a);
            // Estimate FEV1/FVC from analysis metrics if available
            const metricFev1 = data.metrics?.find((m: any) => m.label?.toLowerCase().includes("fev1") && !m.label?.toLowerCase().includes("ratio"));
            const metricFvc  = data.metrics?.find((m: any) => m.label?.toLowerCase().includes("fvc"));
            const metricRatio = data.metrics?.find((m: any) => m.label?.toLowerCase().includes("ratio"));
            const fev1Val  = metricFev1  ? parseFloat(metricFev1.value)  || 0 : 0;
            const fvcVal   = metricFvc   ? parseFloat(metricFvc.value)   || 0 : 0;
            const ratioVal = metricRatio ? parseFloat(metricRatio.value) || 0 : fev1Val && fvcVal ? +((fev1Val/fvcVal)*100).toFixed(1) : 0;
            saveTestRecord({
              id: Math.random().toString(36).slice(2),
              date: new Date().toISOString(),
              fev1: fev1Val,
              fvc: fvcVal,
              ratio: ratioVal,
              peakPressure: bestRound.peakPressure,
              rounds: roundsData.length,
              status: data.overallStatus as "green" | "yellow" | "red",
              isSimulated,
            });
          }
          setStage(8);
        },
        onError: (err: any) => {
          setAnalysisError(err?.message || "Failed to analyze data");
        }
      });
    }
  }, [stage]);

  const resetAll = async () => {
    await cleanupSerial();
    setStage(1);
    setRoundsTotal(3);
    setAge("");
    setSex("");
    setIsSimulated(false);
    setIsConnected(false);
    setCurrentRound(1);
    setPhase('in');
    setRoundsData([]);
    setAnalysisResult(null);
    setAnalysisError(null);
    rawReadingsRef.current = [];
  };

  const renderStage1 = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center flex-1 w-full px-6 py-10">
      <div className="text-center w-full max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em] mb-3"
          style={{ color: "#2563EB", background: "rgba(37,99,235,0.07)", border: "1px solid rgba(37,99,235,0.15)", boxShadow: "0 2px 8px rgba(37,99,235,0.08)" }}>
          <Activity className="w-2.5 h-2.5" /> Lung Function Test
        </span>
        <h1 className="text-4xl font-display font-black tracking-tight text-[#1B2D6B] mb-3">Spirometry Test</h1>
        <p className="text-sm mb-12" style={{ color: "#64748B" }}>Select how many rounds you'd like to perform</p>
      
        <div className="grid grid-cols-3 gap-5 w-full">
          {[1, 2, 3].map(num => (
            <motion.div key={num} className="flex flex-col items-center w-full" whileHover={{ y: -4 }}>
              <button
                className="w-full aspect-square flex flex-col items-center justify-center cursor-pointer rounded-2xl transition-all duration-200 active:scale-95 bg-white border hover:border-[#3B82F6]"
                style={{ 
                  border: '1px solid rgba(27,45,107,0.07)',
                  boxShadow: '0 2px 4px rgba(27,45,107,0.04), 0 8px 32px rgba(27,45,107,0.06)'
                }}
                onClick={() => { setRoundsTotal(num); setStage(2); }}
                data-testid={`button-round-${num}`}
              >
                <span className="text-4xl font-display font-black text-[#1B2D6B] mb-1">{num}</span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>{num === 1 ? "Round" : "Rounds"}</span>
              </button>
              {num === 3 && (
                <span className="mt-3 text-xs font-semibold px-3 py-1 rounded-full" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>Recommended</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderStage2 = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="flex flex-col items-center justify-center flex-1 w-full px-6 py-10">
      <Card className="w-full max-w-md p-8 bg-white rounded-2xl"
        style={{ border: '1px solid rgba(27,45,107,0.07)', boxShadow: '0 2px 4px rgba(27,45,107,0.04), 0 8px 32px rgba(27,45,107,0.07), 0 24px 64px rgba(27,45,107,0.04)' }}>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em] mb-3"
          style={{ color: "#2563EB", background: "rgba(37,99,235,0.07)", border: "1px solid rgba(37,99,235,0.15)" }}>
          Onboarding Step 1
        </span>
        <h2 className="text-2xl font-display font-black text-[#1B2D6B] mb-2">Optional: Your Age</h2>
        <p className="text-sm text-[#64748B] mb-8">This helps tailor the analysis. You may skip this.</p>
        
        <input 
          type="number" 
          placeholder="e.g. 35" 
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition bg-slate-50/50 text-[#1B2D6B] placeholder-slate-400 text-lg font-bold text-center mb-8"
          autoFocus
          data-testid="input-age"
        />
        
        <div className="flex justify-between items-center gap-4">
          <button onClick={() => setStage(3)} className="px-6 py-2.5 rounded-xl text-xs font-bold transition-all text-[#64748B] hover:text-[#1B2D6B]" data-testid="button-skip-age">
            Skip
          </button>
          <button 
            onClick={() => setStage(3)} 
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:shadow-lg active:scale-95 flex items-center gap-1.5" 
            style={{ background: "linear-gradient(135deg, #1B2D6B, #2563EB)" }}
            data-testid="button-next-age"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </motion.div>
  );

  const renderStage3 = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="flex flex-col items-center justify-center flex-1 w-full px-6 py-10">
      <Card className="w-full max-w-md p-8 border border-[rgba(27,45,107,0.08)] bg-white rounded-2xl shadow-[0_20px_50px_rgba(27,45,107,0.06)]">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2 block" style={{ color: "#2563EB" }}>Onboarding Step 2</span>
        <h2 className="text-2xl font-display font-black text-[#1B2D6B] mb-2">Optional: Biological Sex</h2>
        <p className="text-sm text-[#64748B] mb-8">Used for reference range calculations. You may skip.</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          {["Female", "Male", "Nonbinary", "Prefer not to Say"].map(option => (
            <button 
              key={option}
              className="py-3 px-4 rounded-xl text-sm font-bold border transition-all cursor-pointer bg-slate-50/50 hover:bg-slate-100/50"
              style={sex === option ? {
                background: "rgba(37,99,235,0.08)",
                borderColor: "rgba(37,99,235,0.2)",
                color: "#2563EB"
              } : {
                borderColor: "rgba(27,45,107,0.08)",
                color: "#64748B"
              }}
              onClick={() => {
                setSex(option);
                setStage(4);
              }}
              data-testid={`button-sex-${option.toLowerCase().replace(/\s/g, '-')}`}
            >
              {option}
            </button>
          ))}
        </div>
        
        <div className="flex justify-center">
          <button onClick={() => setStage(4)} className="px-6 py-2.5 rounded-xl text-xs font-bold transition-all text-[#64748B] hover:text-[#1B2D6B]" data-testid="button-skip-sex">
            Skip
          </button>
        </div>
      </Card>
    </motion.div>
  );

  const renderStage4 = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center flex-1 max-w-xl mx-auto px-4 w-full text-center">
      {isConnecting ? (
        <>
          <div className="flex items-center justify-center mb-6">
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Usb className="w-16 h-16 text-primary" />
            </motion.div>
          </div>
          <h1 className="text-3xl font-semibold mb-3">Connecting…</h1>
          <p className="text-slate-500 mb-8">Select your device from the browser prompt</p>
          <div className="flex gap-2 justify-center">
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-primary"
                animate={{ opacity: [0.2, 1, 0.2], y: [0, -6, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
              />
            ))}
          </div>
        </>
      ) : !isConnected ? (
        <>
          <Usb className="w-16 h-16 text-slate-300 mb-6" />
          <h1 className="text-3xl font-semibold mb-2">Connect Your Device</h1>
          <p className="text-slate-500 mb-10">Connect your ESP32 pressure sensor via USB, then click Connect.</p>
          {connectError && (
            <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 max-w-sm">
              {connectError}
            </div>
          )}
          <div className="flex flex-col items-center w-full">
            <Button size="lg" className="w-full max-w-sm mb-4 py-6 text-lg" onClick={connectSerial} data-testid="button-connect-usb">
              Connect via USB Serial
            </Button>
            <button
              className="text-slate-400 hover:text-slate-600 text-sm underline underline-offset-4 mt-4 transition-colors"
              onClick={() => {
                setIsSimulated(true);
                setStage(5);
              }}
              data-testid="button-skip-usb"
            >
              Skip (use simulated data)
            </button>
            <p className="text-xs text-slate-400 mt-8">Requires Google Chrome or Microsoft Edge for device connection</p>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center">
          <div className="flex items-center text-emerald-600 mb-8 bg-emerald-50 px-6 py-3 rounded-full">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            <span className="font-medium">Device Connected</span>
          </div>
          <Button size="lg" onClick={() => setStage(5)} data-testid="button-continue-usb">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      )}
    </motion.div>
  );

  const renderStage5 = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="flex flex-col items-center justify-center flex-1 px-4 w-full">
      <h1 className="text-3xl font-semibold mb-2">Ready to Begin</h1>
      <p className="text-slate-500 mb-16 max-w-md text-center">Please prepare your venturi tube and attach your device.</p>
      
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <Button 
          size="lg" 
          className="rounded-full w-48 h-48 text-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          onClick={() => {
            rawReadingsRef.current = [];
            setStage(6);
          }}
          data-testid="button-ready"
        >
          Press When Ready
        </Button>
      </motion.div>
    </motion.div>
  );

  const renderStage6 = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="flex flex-col items-center justify-center flex-1 px-4 w-full min-h-[500px]">
      
      {/* Round counter + controls */}
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: "#64748b" }}>
          {isPracticeMode ? "🎯 Practice Round" : `Round ${currentRound} of ${roundsTotal}`}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => setVoiceEnabled(v => !v)}
            className="p-2 rounded-xl cursor-pointer transition-all"
            style={{ background: "rgba(27,45,107,0.07)", border: "1px solid rgba(27,45,107,0.1)", color: voiceEnabled ? "#1B2D6B" : "#94A3B8" }}
            title={voiceEnabled ? "Disable voice guidance" : "Enable voice guidance"}>
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {(phase === 'in' || phase === 'out') && (
        <div className="text-center flex flex-col items-center gap-4">
          <motion.div key={phase} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-1"
              style={{ color: phase === 'in' ? "#1B2D6B" : "#059669" }}>
              {phase === 'in' ? '💨 Breathe In Deeply' : '🫁 Exhale Now!'}
            </h1>
            <p className="text-base" style={{ color: "#64748b" }}>
              {phase === 'in' ? 'Inhale completely — fill your lungs' : 'Blow out as hard and fast as you can!'}
            </p>
          </motion.div>
          
          {/* Balloon Mini-Game */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            <motion.div
              animate={{
                scale: phase === 'in' ? [1, 1.5] : [1.5, 1],
                backgroundColor: phase === 'in' ? "#3b82f6" : "#059669",
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 5, ease: "linear" }}
              className="absolute w-40 h-40 rounded-full filter blur-xl"
            />
            <div className="z-10 flex flex-col items-center">
              <BalloonGame pressure={livePressure} phase={phase} />
              {/* Countdown ring */}
              <div className="mt-2 flex flex-col items-center justify-center w-16 h-16 rounded-full"
                style={{ background: "rgba(27,45,107,0.07)", border: "2px solid rgba(27,45,107,0.15)" }}>
                <span className="text-2xl font-black" style={{ color: "#1B2D6B" }}>{countdown}</span>
                <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: "#94A3B8" }}>sec</span>
              </div>
            </div>
          </div>

          {(isConnected || isSimulated) && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
              style={{ background: "#FFFFFF", border: "1px solid rgba(27,45,107,0.1)", boxShadow: "0 2px 8px rgba(27,45,107,0.07)", color: "#64748b" }}>
              <Activity className="w-4 h-4" style={{ color: "#1B2D6B" }} />
              <span className="font-mono">Pressure: {livePressure.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div className="text-center">
          <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-3xl font-semibold mb-4">Round {currentRound} Complete</h2>
          {currentRound < roundsTotal ? (
            <p className="text-xl text-slate-500">Get Ready for Round {currentRound + 1} in {countdown}...</p>
          ) : (
            <p className="text-xl text-slate-500">Finishing test...</p>
          )}
        </div>
      )}
    </motion.div>
  );

  const renderStage7 = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="flex flex-col items-center justify-center flex-1 px-4 w-full">
      {analysisError ? (
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <RefreshCw className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Analysis Failed</h2>
          <p className="text-slate-500 mb-8">{analysisError}</p>
          <Button onClick={() => setStage(7)} data-testid="button-retry-analysis">Retry Analysis</Button>
        </div>
      ) : (
        <div className="text-center flex flex-col items-center">
          <div className="flex items-center gap-2 mb-8">
            <span className="w-3 h-3 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0ms" }} />
            <span className="w-3 h-3 rounded-full bg-primary animate-pulse" style={{ animationDelay: "300ms" }} />
            <span className="w-3 h-3 rounded-full bg-primary animate-pulse" style={{ animationDelay: "600ms" }} />
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-slate-800">Analyzing your results...</h2>
          <p className="text-slate-500">This may take a moment</p>
        </div>
      )}
    </motion.div>
  );

  const renderStage8 = () => {
    if (!analysisResult) return null;

    const statusColors = {
      green: "bg-emerald-100 text-emerald-700 border-emerald-200",
      yellow: "bg-amber-100 text-amber-700 border-amber-200",
      red: "bg-red-100 text-red-700 border-red-200"
    };

    const statusBadgeColors = {
      green: "bg-emerald-500",
      yellow: "bg-amber-500",
      red: "bg-red-500"
    };

    const fadeIn = (delay: number) => ({
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5, delay },
    });

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="flex-1 py-10 px-4 md:px-8 max-w-4xl mx-auto w-full print:py-0 print:px-0">
        
        {/* Natively print-formatted CSS Stylesheet */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white !important; color: black !important; }
            aside, nav, header, footer, button, .no-print { display: none !important; }
            .print-container { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
            .print-border { border: 1px solid #cbd5e1 !important; border-radius: 12px !important; padding: 20px !important; }
          }
        `}} />

        <div className="print-container print-border">
          
          {/* Printable Report Header */}
          <div className="hidden print:flex items-center justify-between border-b border-slate-300 pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900">ReVive Spirometric Report</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">AI-Assisted Diagnostics System</span>
            </div>
            <div className="text-right text-xs text-slate-500">
              <span>Date: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <motion.div {...fadeIn(0.1)} className="flex items-center justify-between mb-8 border-b border-slate-200 pb-6 print:border-b-0 print:pb-0">
            <h1 className="text-3xl font-semibold text-slate-900 print:text-xl print:font-bold">Test Evaluation Summary</h1>
            <div className="flex gap-2 items-center">
              <button 
                onClick={() => window.print()}
                className="no-print px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer mr-2 shadow-sm"
              >
                <FileText className="w-4 h-4 text-slate-400" /> Print Report
              </button>
              <div className={`px-4 py-1.5 rounded-full border font-medium flex items-center ${statusColors[analysisResult.overallStatus]}`}>
                <span className={`w-2.5 h-2.5 rounded-full mr-2 ${statusBadgeColors[analysisResult.overallStatus]}`}></span>
                {analysisResult.overallStatus.charAt(0).toUpperCase() + analysisResult.overallStatus.slice(1)}
              </div>
            </div>
          </motion.div>

          <motion.p {...fadeIn(0.25)} className="text-lg text-slate-700 leading-relaxed mb-10 bg-slate-50 p-6 rounded-xl border border-slate-100 print:bg-white print:border-0 print:p-0 print:mb-6 print:text-sm">
            {analysisResult.summary}
          </motion.p>

          <motion.div {...fadeIn(0.4)} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mb-10 print:shadow-none print:border-slate-350">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 print:bg-slate-100">
                  <th className="py-4 px-6 font-medium text-slate-500 text-sm w-1/4 print:py-2 print:px-4">Metric</th>
                  <th className="py-4 px-6 font-medium text-slate-500 text-sm print:py-2 print:px-4">Value</th>
                  <th className="py-4 px-6 font-medium text-slate-500 text-sm w-12 text-center print:py-2 print:px-4">Status</th>
                  <th className="py-4 px-6 font-medium text-slate-500 text-sm w-2/5 print:py-2 print:px-4">What This Means</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                {analysisResult.metrics.map((metric, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + idx * 0.08 }}
                    className="hover:bg-slate-50/50 transition-colors print:hover:bg-white"
                  >
                    <td className="py-4 px-6 font-medium text-slate-800 print:py-2 print:px-4 print:text-xs">{metric.label}</td>
                    <td className="py-4 px-6 print:py-2 print:px-4 print:text-xs">
                      <span className="font-mono text-lg print:text-sm">{metric.value}</span>
                      <span className="text-slate-400 ml-1 text-sm print:text-xs">{metric.unit}</span>
                      {metric.percentOfNormal && (
                        <div className="text-xs text-slate-500 mt-1 print:text-[10px]">{metric.percentOfNormal}% of predicted</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center print:py-2 print:px-4">
                      <div className={`w-3 h-3 rounded-full mx-auto ${statusBadgeColors[metric.status]}`} title={metric.status} />
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-sm leading-relaxed print:py-2 print:px-4 print:text-xs print:leading-normal">{metric.interpretation}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {analysisResult.recommendations.length > 0 && (
            <motion.div {...fadeIn(0.75)} className="mb-12 print:mb-6">
              <h3 className="text-lg font-semibold mb-4 text-slate-900 print:text-sm print:font-bold">Recommendations</h3>
              <ul className="space-y-3 print:space-y-1.5">
                {analysisResult.recommendations.map((rec, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.85 + idx * 0.07 }}
                    className="flex items-start print:text-xs"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-3 flex-shrink-0 print:mt-1.5 print:bg-slate-600" />
                    <span className="text-slate-700">{rec}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          <motion.div {...fadeIn(1.0)} className="pt-8 border-t border-slate-200 flex flex-col items-center print:pt-4">
            <Button variant="outline" size="lg" onClick={resetAll} className="mb-8 no-print" data-testid="button-start-over">
              Start Over
            </Button>
            <p className="text-xs text-slate-400 text-center max-w-xl leading-relaxed print:text-[9px] print:leading-normal">
              {analysisResult.disclaimer}
            </p>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  const getStepperStep = (s: Stage) => {
    if (s <= 3) return 1;
    if (s === 4) return 2;
    if (s <= 6) return 3;
    return 4;
  };

  const currentStep = getStepperStep(stage);

  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-900 selection:bg-primary/20 flex flex-col">
      <div className="flex-1 flex flex-col">
        {/* Stepper Progress Indicator */}
        <div className="max-w-md mx-auto w-full px-6 pt-6 pb-2 select-none">
          <div className="w-full flex items-center justify-between relative mb-6 px-1">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200/70 -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500" 
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            />

            {[
              { step: 1, label: "Setup" },
              { step: 2, label: "Connect" },
              { step: 3, label: "Test" },
              { step: 4, label: "Report" }
            ].map((item) => {
              const isCompleted = currentStep > item.step;
              const isActive = currentStep === item.step;
              
              return (
                <div key={item.step} className="flex flex-col items-center relative z-10">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 bg-white"
                    style={isCompleted ? {
                      background: "#10b981",
                      borderColor: "#10b981",
                      color: "white"
                    } : isActive ? {
                      borderColor: "#2563EB",
                      color: "#2563EB",
                      boxShadow: "0 0 12px rgba(37,99,235,0.25)"
                    } : {
                      borderColor: "#E2E8F0",
                      color: "#94A3B8"
                    }}
                  >
                    {isCompleted ? "✓" : item.step}
                  </div>
                  <span 
                    className="text-[9px] font-black uppercase tracking-wider mt-1.5"
                    style={isActive ? { color: "#2563EB" } : isCompleted ? { color: "#10b981" } : { color: "#94A3B8" }}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {stage === 1 && renderStage1()}
          {stage === 2 && renderStage2()}
          {stage === 3 && renderStage3()}
          {stage === 4 && renderStage4()}
          {stage === 5 && renderStage5()}
          {stage === 6 && renderStage6()}
          {stage === 7 && renderStage7()}
          {stage === 8 && renderStage8()}
        </AnimatePresence>
      </div>
      <footer className="w-full px-6 py-4 mt-auto" style={{ borderTop: "1px solid rgba(27,45,107,0.08)", background: "#FFFFFF" }}>
        <p className="text-center text-xs leading-relaxed max-w-3xl mx-auto" style={{ color: "#64748B" }}>
          <span className="font-semibold" style={{ color: "#1B2D6B" }}>Disclaimer:</span> This website and device are intended for personal, informational use only. Readings are not a substitute for clinically validated spirometry equipment or professional medical assessment. Consult a qualified healthcare professional for any breathing concerns.
        </p>
      </footer>
    </div>
  );
}
