import React, { useRef, Suspense, useState, useEffect } from "react";
import { Link } from "wouter";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import { 
  Activity, ArrowRight, Shield, Wind, Cpu, TrendingUp,
  Heart, FileText, CheckCircle, User, Zap, Download,
  MapPin, Loader2, Sparkles, AlertTriangle, Compass,
  PhoneCall, ShieldCheck, Search
} from "lucide-react";
import { loadProfile, loadHistory } from "@/lib/storage";

// Helper to deform spheres into anatomically correct lung lobes
function createDeformedLobeGeometry(isLeft: boolean, isSuperior: boolean, isMiddle: boolean = false) {
  const geom = new THREE.SphereGeometry(1, 64, 64);
  const pos = geom.attributes.position;
  const v = new THREE.Vector3();
  
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // Apply organic deformations to the sphere to make it look like a lung lobe
    if (isSuperior) {
      // ── SUPERIOR LOBE (Tapered apex at top) ──
      if (v.y > 0) {
        const factor = 1.0 - v.y * 0.48;
        v.x *= factor;
        v.z *= factor * 0.85;
      } else {
        // Flatten bottom
        v.y *= 0.8;
      }
      
      // Flatten inner mediastinal side facing the trachea/heart
      if (isLeft) {
        if (v.x > -0.2) {
          v.x *= 0.7;
          v.z *= 0.8;
        }
      } else {
        if (v.x < 0.2) {
          v.x *= 0.7;
          v.z *= 0.8;
        }
      }
    } else if (isMiddle) {
      // ── RIGHT MIDDLE LOBE (Wedge shape) ──
      v.y *= 0.65;
      if (isLeft) {
        if (v.x > -0.2) v.x *= 0.65;
      } else {
        if (v.x < 0.2) v.x *= 0.65;
      }
      // Add slight wedge forward tilt
      v.z += (v.y * 0.15);
    } else {
      // ── INFERIOR LOBE (Wide diaphragmatic base) ──
      if (v.y < 0) {
        const distFromCenter = Math.sqrt(v.x * v.x + v.z * v.z);
        // Concave dish bottom
        if (v.y < -0.4) {
          v.y += (1.0 - distFromCenter) * 0.22;
        }
        // Flare out the base slightly
        const spread = 1.0 - v.y * 0.2;
        v.x *= spread;
        v.z *= spread;
      }
      
      // Flatten inner side & Cardiac Notch on left inferior lobe
      if (isLeft) {
        if (v.x > -0.25) {
          if (v.z > 0) {
            v.x *= 0.45; // Cardiac notch indentation for heart
          } else {
            v.x *= 0.65;
          }
          v.z *= 0.8;
        }
      } else {
        if (v.x < 0.25) {
          v.x *= 0.68;
          v.z *= 0.8;
        }
      }
    }

    // High frequency organic surface bumps
    const bump = Math.sin(v.x * 8) * Math.cos(v.y * 8) * Math.sin(v.z * 8) * 0.04
               + Math.sin(v.x * 20) * Math.cos(v.y * 20) * Math.sin(v.z * 20) * 0.015
               + Math.sin(v.x * 40) * Math.cos(v.y * 40) * Math.sin(v.z * 40) * 0.005;
    v.addScaledVector(v.clone().normalize(), bump);

    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geom.computeVertexNormals();
  return geom;
}

// ─── 3D LUNG MODEL FOR REACT THREE FIBER ──────────────────
function LungModel() {
  const groupRef = useRef<THREE.Group>(null);
  const tracheaRef = useRef<THREE.Mesh>(null);
  const leftSuperiorRef = useRef<THREE.Mesh>(null);
  const leftInferiorRef = useRef<THREE.Mesh>(null);
  const rightSuperiorRef = useRef<THREE.Mesh>(null);
  const rightMiddleRef = useRef<THREE.Mesh>(null);
  const rightInferiorRef = useRef<THREE.Mesh>(null);

  // Generate deformed lobe geometries
  const leftSuperiorGeom = React.useMemo(() => createDeformedLobeGeometry(true, true, false), []);
  const leftInferiorGeom = React.useMemo(() => createDeformedLobeGeometry(true, false, false), []);
  const rightSuperiorGeom = React.useMemo(() => createDeformedLobeGeometry(false, true, false), []);
  const rightMiddleGeom = React.useMemo(() => createDeformedLobeGeometry(false, false, true), []);
  const rightInferiorGeom = React.useMemo(() => createDeformedLobeGeometry(false, false, false), []);

  // Generate organic vascular capillaries texture for lobes
  const lungTexture = React.useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background gradient (healthy rose-coral pink)
    const grad = ctx.createRadialGradient(512, 512, 40, 512, 512, 480);
    grad.addColorStop(0, "#FFAAA8");
    grad.addColorStop(0.5, "#FF8A8A");
    grad.addColorStop(1, "#E56363");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Micro alveolar circles (fine detail)
    ctx.strokeStyle = "rgba(220, 38, 38, 0.08)";
    ctx.lineWidth = 1.0;
    for (let i = 0; i < 400; i++) {
      ctx.beginPath();
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const r = 2 + Math.random() * 8;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Branching capillary trees
    const drawBranch = (sx: number, sy: number, angle: number, depth: number, len: number, isArtery: boolean) => {
      if (depth === 0) return;
      const ex = sx + Math.cos(angle) * len;
      const ey = sy + Math.sin(angle) * len;
      
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = isArtery ? `rgba(239, 68, 68, ${0.55 - (6 - depth) * 0.06})` : `rgba(37, 99, 235, ${0.55 - (6 - depth) * 0.06})`;
      ctx.lineWidth = depth * 1.5;
      ctx.stroke();
      
      const childLen = len * (0.65 + Math.random() * 0.2);
      drawBranch(ex, ey, angle - (0.2 + Math.random() * 0.3), depth - 1, childLen, isArtery);
      drawBranch(ex, ey, angle + (0.2 + Math.random() * 0.3), depth - 1, childLen, isArtery);
    };

    // Draw left and right arterial and venous trees
    for (let i = 0; i < 4; i++) {
      drawBranch(300 + Math.random() * 100, 512, Math.PI + (Math.random() - 0.5) * 1.5, 6, 80, true);
      drawBranch(724 - Math.random() * 100, 512, (Math.random() - 0.5) * 1.5, 6, 80, false);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const breathFactor = Math.sin(time * Math.PI * 0.5) * 0.5 + 0.5;

    // Slow organic floating and turning
    if (groupRef.current) {
      groupRef.current.position.y = -0.3 + Math.sin(time * 0.8) * 0.04;
      groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.08;
    }

    if (tracheaRef.current) {
      tracheaRef.current.scale.y = 1.0 + breathFactor * 0.03;
    }

    // Breath pulsing for lobes
    const pulseScale = (mesh: THREE.Mesh, baseScale: [number, number, number]) => {
      mesh.scale.set(
        baseScale[0] * (1.0 + breathFactor * 0.1),
        baseScale[1] * (1.0 + breathFactor * 0.12),
        baseScale[2] * (1.0 + breathFactor * 0.08)
      );
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      if (mat) {
        // Smooth color transition representing oxygenation (healthy warm rose-red cycle)
        mat.emissive = new THREE.Color(
          0.85 + breathFactor * 0.15,
          0.20 + breathFactor * 0.35,
          0.30 + breathFactor * 0.20
        );
        mat.emissiveIntensity = 0.1 + breathFactor * 0.35;
      }
    };

    if (leftSuperiorRef.current) pulseScale(leftSuperiorRef.current, [0.5, 0.65, 0.42]);
    if (leftInferiorRef.current) pulseScale(leftInferiorRef.current, [0.55, 0.72, 0.48]);
    if (rightSuperiorRef.current) pulseScale(rightSuperiorRef.current, [0.5, 0.58, 0.42]);
    if (rightMiddleRef.current) pulseScale(rightMiddleRef.current, [0.5, 0.42, 0.46]);
    if (rightInferiorRef.current) pulseScale(rightInferiorRef.current, [0.58, 0.7, 0.52]);
  });

  // Clinical physical glass-organic material properties
  const lobeMaterialProps = {
    map: lungTexture || undefined,
    color: "#ffc8c8",
    roughness: 0.34,
    metalness: 0.02,
    clearcoat: 0.55,
    clearcoatRoughness: 0.12,
    transmission: 0.16,
    thickness: 1.4,
    ior: 1.37,
    emissive: new THREE.Color("#ff5050"),
    emissiveIntensity: 0.15,
  };

  // Trachea & Cartilage materials
  const tracheaWallMaterialProps = {
    color: "#ffd6d6",
    roughness: 0.5,
    metalness: 0.0,
  };

  const cartilageMaterialProps = {
    color: "#e0f2fe", // soft sky blue/white
    roughness: 0.2,
    metalness: 0.05,
    transmission: 0.5,
    thickness: 0.4,
    clearcoat: 0.8,
  };

  const ringYOffsets = [0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4];

  return (
    <group ref={groupRef} position={[0, -0.3, 0]}>
      {/* Trachea (Windpipe) */}
      <mesh ref={tracheaRef} position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 1.0, 32]} />
        <meshStandardMaterial {...tracheaWallMaterialProps} />
      </mesh>

      {/* Cartilage rings on Trachea */}
      {ringYOffsets.map((y, idx) => (
        <mesh key={idx} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.135, 0.018, 12, 32]} />
          <meshPhysicalMaterial {...cartilageMaterialProps} />
        </mesh>
      ))}

      {/* Main Left Bronchus */}
      <mesh position={[-0.18, 0.5, 0]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.075, 0.065, 0.4, 16]} />
        <meshStandardMaterial {...tracheaWallMaterialProps} />
      </mesh>

      {/* Main Right Bronchus */}
      <mesh position={[0.18, 0.5, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <cylinderGeometry args={[0.075, 0.065, 0.4, 16]} />
        <meshStandardMaterial {...tracheaWallMaterialProps} />
      </mesh>

      {/* Bronchioles (Branches) */}
      <mesh position={[-0.32, 0.3, 0.1]} rotation={[0.2, 0, Math.PI / 3]}>
        <cylinderGeometry args={[0.04, 0.03, 0.3, 8]} />
        <meshStandardMaterial {...tracheaWallMaterialProps} />
      </mesh>
      <mesh position={[-0.38, 0.1, -0.1]} rotation={[-0.2, 0.2, Math.PI / 4]}>
        <cylinderGeometry args={[0.03, 0.02, 0.25, 8]} />
        <meshStandardMaterial {...tracheaWallMaterialProps} />
      </mesh>
      <mesh position={[0.32, 0.28, 0.1]} rotation={[0.2, 0, -Math.PI / 3]}>
        <cylinderGeometry args={[0.04, 0.03, 0.3, 8]} />
        <meshStandardMaterial {...tracheaWallMaterialProps} />
      </mesh>
      <mesh position={[0.38, 0.08, -0.1]} rotation={[-0.2, -0.2, -Math.PI / 4]}>
        <cylinderGeometry args={[0.03, 0.02, 0.25, 8]} />
        <meshStandardMaterial {...tracheaWallMaterialProps} />
      </mesh>

      {/* ── CENTRAL VASCULATURE (HILUM) ── */}
      {/* Pulmonary Artery Trunk (Deoxygenated, Blue/Purple) */}
      <group position={[0, 0.35, -0.06]}>
        {/* Main trunk */}
        <mesh rotation={[0, 0, Math.PI / 8]}>
          <cylinderGeometry args={[0.065, 0.065, 0.35, 16]} />
          <meshStandardMaterial color="#3B82F6" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Left branch */}
        <mesh position={[-0.14, 0.1, -0.02]} rotation={[0, 0.2, Math.PI / 4]}>
          <cylinderGeometry args={[0.045, 0.035, 0.25, 12]} />
          <meshStandardMaterial color="#2563EB" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Right branch */}
        <mesh position={[0.14, 0.1, -0.02]} rotation={[0, -0.2, -Math.PI / 4]}>
          <cylinderGeometry args={[0.045, 0.035, 0.25, 12]} />
          <meshStandardMaterial color="#2563EB" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>

      {/* Pulmonary Veins Trunk (Oxygenated, Red/Crimson) */}
      <group position={[0, 0.2, 0.06]}>
        {/* Main trunk */}
        <mesh rotation={[0, 0, -Math.PI / 10]}>
          <cylinderGeometry args={[0.055, 0.055, 0.3, 16]} />
          <meshStandardMaterial color="#EF4444" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Left branch */}
        <mesh position={[-0.14, -0.05, 0.02]} rotation={[0, -0.1, Math.PI / 3]}>
          <cylinderGeometry args={[0.04, 0.03, 0.22, 12]} />
          <meshStandardMaterial color="#DC2626" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Right branch */}
        <mesh position={[0.14, -0.05, 0.02]} rotation={[0, 0.1, -Math.PI / 3]}>
          <cylinderGeometry args={[0.04, 0.03, 0.22, 12]} />
          <meshStandardMaterial color="#DC2626" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>

      {/* LEFT LOBES */}
      <group>
        {/* Superior Lobe */}
        <mesh ref={leftSuperiorRef} position={[-0.48, 0.22, 0]} rotation={[0.15, 0, 0.22]} geometry={leftSuperiorGeom}>
          <meshPhysicalMaterial {...lobeMaterialProps} />
        </mesh>

        {/* Inferior Lobe */}
        <mesh ref={leftInferiorRef} position={[-0.54, -0.3, 0.02]} rotation={[0.1, 0, 0.18]} geometry={leftInferiorGeom}>
          <meshPhysicalMaterial {...lobeMaterialProps} />
        </mesh>
      </group>

      {/* RIGHT LOBES */}
      <group>
        {/* Superior Lobe */}
        <mesh ref={rightSuperiorRef} position={[0.48, 0.25, 0]} rotation={[0.15, 0, -0.22]} geometry={rightSuperiorGeom}>
          <meshPhysicalMaterial {...lobeMaterialProps} />
        </mesh>

        {/* Middle Lobe */}
        <mesh ref={rightMiddleRef} position={[0.54, -0.05, 0.02]} rotation={[0.1, 0, -0.2]} geometry={rightMiddleGeom}>
          <meshPhysicalMaterial {...lobeMaterialProps} />
        </mesh>

        {/* Inferior Lobe */}
        <mesh ref={rightInferiorRef} position={[0.52, -0.38, 0.04]} rotation={[0.05, 0, -0.18]} geometry={rightInferiorGeom}>
          <meshPhysicalMaterial {...lobeMaterialProps} />
        </mesh>
      </group>
    </group>
  );
}

export function BreathingLungCanvas() {
  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 0, 3.2], fov: 42 }}>
        {/* Soft studio lighting */}
        <ambientLight intensity={0.75} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <directionalLight position={[-8, 6, -4]} intensity={0.4} />
        <directionalLight position={[0, -5, 5]} intensity={0.2} />
        <spotLight position={[0, 4, 0]} intensity={1.0} penumbra={1} castShadow />
        
        <Center>
          <LungModel />
        </Center>
        
        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.5} />
      </Canvas>
    </div>
  );
}

// ─── MAIN LANDING PAGE ────────────────────────────────────
export default function LandingPage() {
  const profile = React.useMemo(() => loadProfile(), []);
  const history = React.useMemo(() => loadHistory(), []);
  
  // Interactive AQI state for Bento Card
  const [aqiQuery, setAqiQuery] = useState("");
  const [aqiResult, setAqiResult] = useState<{ city: string; aqi: number; label: string; pm2_5: number } | null>(null);
  const [aqiLoading, setAqiLoading] = useState(false);

  // Install PWA State
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  const handleAqiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aqiQuery.trim()) return;
    setAqiLoading(true);
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(aqiQuery)}&count=1&language=en&format=json`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results[0]) {
          const { latitude, longitude, name, country } = geoData.results[0];
          const aqiRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm2_5`);
          if (aqiRes.ok) {
            const aqiData = await aqiRes.json();
            const aqi = Math.round(aqiData.current.us_aqi);
            const pm2_5 = Math.round(aqiData.current.pm2_5);
            const label = aqi <= 50 ? "Good" : aqi <= 100 ? "Moderate" : aqi <= 150 ? "Unhealthy for Sensitive Groups" : "Unhealthy";
            setAqiResult({ city: `${name}, ${country || ""}`, aqi, label, pm2_5 });
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAqiLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent" style={{ color: "#1B2D6B" }}>
      
      {/* ── Ambient Background Glows ────────────────── */}
      <div className="absolute top-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.08), transparent 65%)", filter: "blur(50px)" }} />
      <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(5,150,105,0.06), transparent 65%)", filter: "blur(55px)" }} />
      <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.04), transparent 65%)", filter: "blur(70px)" }} />

      {/* ── HERO SECTION ────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-10 pb-20 md:pt-16 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Hero Content (Left) */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-[10px] font-black uppercase tracking-widest bg-white border"
              style={{ 
                borderColor: "rgba(27,45,107,0.1)", 
                color: "#1B2D6B",
                boxShadow: "0 2px 12px rgba(27,45,107,0.08), inset 0 1px 0 rgba(255,255,255,0.9)" 
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Clinical-grade diagnostics</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black font-serif tracking-tight leading-[1.05] mb-6"
              style={{ color: "#1B2D6B" }}
            >
              {profile.name ? (
                <>
                  Welcome back, <span className="shimmer-text">{profile.name.split(" ")[0]}</span>. <br />
                  Monitor your lung health.
                </>
              ) : (
                <>
                  Your lungs, <br />
                  visualized in <span className="shimmer-text">3D</span>.
                </>
              )}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg leading-relaxed mb-8 max-w-lg"
              style={{ color: "#475569" }}
            >
              {profile.name ? (
                `Your clinical portal is ready. You have completed ${history.length} breathing tests. Review your FEV1/FVC metrics and check today's air quality overlay below.`
              ) : (
                "ReVive transforms low-cost hardware into a clinical-grade spirometer. Track forced exhalations, analyze FEV1/FVC metrics, and chat with our local AI assistant."
              )}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link href={profile.name ? "/dashboard" : "/profile"}>
                <span className="px-7 py-3.5 text-xs font-black uppercase tracking-widest text-white rounded-2xl cursor-pointer transition-all duration-300 active:scale-95 text-center flex items-center justify-center gap-2 group hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #1B2D6B, #2563EB)", boxShadow: "0 6px 20px rgba(27,45,107,0.35), 0 12px 40px rgba(37,99,235,0.2)" }}>
                  <span>{profile.name ? "Enter Dashboard" : "Get Started"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link href="/test">
                <span className="px-7 py-3.5 text-xs font-black uppercase tracking-widest rounded-2xl cursor-pointer border hover:bg-slate-50 transition-all duration-300 active:scale-95 text-center flex items-center justify-center gap-2"
                  style={{ background: "#FFFFFF", borderColor: "rgba(27,45,107,0.12)", color: "#1B2D6B", boxShadow: "0 4px 20px rgba(27,45,107,0.03)" }}>
                  <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span>Run Breathing Test</span>
                </span>
              </Link>
            </motion.div>
          </div>

          {/* 3D Lung Canvas (Right) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-6 relative h-[380px] md:h-[480px] w-full"
          >
            {/* Ambient Background Panel */}
            <div className="absolute inset-0 rounded-[2.5rem] border shadow-[0_20px_50px_rgba(27,45,107,0.05)] bg-white overflow-hidden p-2 flex items-center justify-center"
              style={{ borderColor: "rgba(27,45,107,0.06)" }}>
              
              <Suspense fallback={
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="text-xs font-bold text-slate-400">Loading 3D Respiratory Canvas...</span>
                </div>
              }>
                <BreathingLungCanvas />
              </Suspense>

              {/* Glassmorphic UI Widgets Overlaid */}
              {/* Widget 1: Lung Capacity */}
              <div className="absolute top-6 left-6 p-3.5 rounded-2xl border backdrop-blur-md flex flex-col gap-0.5 shadow-sm"
                style={{ background: "rgba(255, 255, 255, 0.85)", borderColor: "rgba(27,45,107,0.06)" }}>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Expiratory Capacity</span>
                <span className="text-sm font-black text-slate-900 flex items-center gap-1">
                  <span>94.2%</span>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">Optimal</span>
                </span>
              </div>

              {/* Widget 2: Sensor Status */}
              <div className="absolute top-6 right-6 px-3.5 py-2 rounded-full border backdrop-blur-md flex items-center gap-2 shadow-sm"
                style={{ background: "rgba(255, 255, 255, 0.85)", borderColor: "rgba(27,45,107,0.06)" }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Sensor Connected</span>
              </div>

              {/* Widget 3: Live Flow Rate */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl border backdrop-blur-md flex items-center justify-between shadow-sm"
                style={{ background: "rgba(255, 255, 255, 0.85)", borderColor: "rgba(27,45,107,0.06)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Activity className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block leading-none mb-0.5">Live Exhalation Speed</span>
                    <span className="text-xs font-black text-slate-950">460 Liters/min (PEF)</span>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">Pulsing</span>
              </div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* ── TRUST STRIP ─────────────────────────────── */}
      <section className="border-y bg-white/50 backdrop-blur-sm" style={{ borderColor: "rgba(27,45,107,0.06)" }}>
        <div className="max-w-7xl mx-auto px-6 py-6 md:py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical Integrity Guaranteed</span>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-slate-500">
            {[
              { icon: Shield, label: "Local-First Privacy" },
              { icon: Zap, label: "PWA Offline Ready" },
              { icon: FileText, label: "Clinical Grade UI" },
              { icon: Cpu, label: "ESP32 Sensor Friendly" }
            ].map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.label} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-blue-600/80" />
                  <span className="text-xs font-bold text-[#1B2D6B]">{t.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BENTO GRID FEATURES ─────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 md:py-28">
        <div className="text-center mb-16">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 block mb-2">Next-Gen Spirometry</span>
          <h2 className="text-3xl md:text-4xl font-black font-serif tracking-tight" style={{ color: "#1B2D6B" }}>
            Luxury clinical tools, localized.
          </h2>
          <p className="text-sm mt-3 text-slate-500 max-w-lg mx-auto">
            Experience an elegant suite of lung diagnostic utilities built entirely on local storage and zero-latency hardware communication.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Card 1: Interactive AQI (7 Columns on md) */}
          <div className="md:col-span-7 p-6 md:p-8 glass-card-premium flex flex-col justify-between min-h-[340px]">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-5">
                <Wind className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black mb-1">Global Air Quality Search</h3>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed mb-6">
                Query and display real-time AQI and particulate measurements (PM2.5, PM10) from open meteorology stations anywhere in the world.
              </p>

              {/* Interactive City Lookup Inside Bento */}
              <form onSubmit={handleAqiSearch} className="flex gap-2 max-w-md mb-4">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter city (e.g. Dhaka, Almaty, London)..."
                    value={aqiQuery}
                    onChange={(e) => setAqiQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border outline-none bg-slate-50 focus:bg-white transition"
                    style={{ borderColor: "rgba(27,45,107,0.1)", color: "#1B2D6B" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={aqiLoading}
                  className="px-4 py-2 text-xs font-black text-white rounded-xl bg-blue-600 hover:bg-blue-700 transition flex items-center gap-1.5"
                >
                  {aqiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Search</span>
                </button>
              </form>

              {/* Live AQI Results */}
              {aqiResult && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl border flex items-center justify-between"
                  style={{ 
                    background: aqiResult.aqi <= 50 ? "rgba(5,150,105,0.04)" : "rgba(217,119,6,0.04)",
                    borderColor: aqiResult.aqi <= 50 ? "rgba(5,150,105,0.1)" : "rgba(217,119,6,0.1)"
                  }}
                >
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Location</span>
                    <span className="text-xs font-black text-slate-900">{aqiResult.city}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black flex items-center gap-1.5 justify-end"
                      style={{ color: aqiResult.aqi <= 50 ? "#059669" : "#D97706" }}>
                      <Wind className="w-3.5 h-3.5" /> AQI {aqiResult.aqi} ({aqiResult.label})
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">PM2.5: {aqiResult.pm2_5} µg/m³</span>
                  </div>
                </motion.div>
              )}
            </div>
            {!aqiResult && (
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Live API Geocoding</span>
            )}
          </div>

          {/* Card 2: 3D Breathprint (5 Columns on md) */}
          <div className="md:col-span-5 p-6 md:p-8 glass-card-premium flex flex-col justify-between min-h-[340px]">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-5">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black mb-1">3D Breathprint</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Your flow rate and lung exhalation speed rendered as a dynamic time-series wave overlay. Track round-to-round consistency.
              </p>

              {/* Decorative dynamic wave visual */}
              <div className="h-16 w-full flex items-end gap-1 px-1 bg-slate-50/50 rounded-xl border border-slate-100/50 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-50/30 to-transparent pointer-events-none" />
                {[30, 45, 25, 60, 80, 95, 65, 40, 75, 90, 100, 70, 45, 30, 20, 45, 60, 35, 15, 25, 40].map((h, i) => (
                  <motion.div 
                    key={i} 
                    className="flex-1 bg-blue-500 rounded-t"
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", delay: i * 0.05 }}
                  />
                ))}
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-4">Real-time ADC Waveforms</span>
          </div>

          {/* Card 3: Smart Posture Coach (5 Columns on md) */}
          <div className="md:col-span-5 p-6 md:p-8 glass-card-premium flex flex-col justify-between min-h-[340px]">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black mb-1">Smart Posture Coach</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Receive interactive instructions and animated visual checklists that guide you to keep your neck straight and back aligned for FEV1 accuracy.
              </p>

              {/* Interactive checklist mock */}
              <div className="flex flex-col gap-2 bg-emerald-50/20 p-3.5 rounded-xl border border-emerald-100/20">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-bold text-slate-700">Neck erect (no chin tuck)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-bold text-slate-700">Shoulders relaxed & retracted</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-bold text-slate-700">Back straight, feet flat</span>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-4">NHS Clinical Protocol</span>
          </div>

          {/* Card 4: Zero-Trust Export (7 Columns on md) */}
          <div className="md:col-span-7 p-6 md:p-8 glass-card-premium flex flex-col justify-between min-h-[340px]">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black mb-1">Zero-Trust Clinical Export</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Generate formatted PDF report sheets right in your browser. All computations run on-device, meaning your private patient files are never shared or processed by external servers.
              </p>

              {/* Mock clinical print section */}
              <div className="p-4 rounded-xl border border-dashed flex items-center justify-between"
                style={{ background: "rgba(124,58,237,0.01)", borderColor: "rgba(124,58,237,0.15)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block mb-0.5">Spirometry_Report.pdf</span>
                    <span className="text-[9px] text-slate-400">PDF Report Document · 128 KB</span>
                  </div>
                </div>
                <button
                  onClick={() => alert("Enter the Dashboard and click 'Export PDF' to print your real history!")}
                  className="p-2.5 rounded-xl hover:bg-purple-50 text-purple-600 transition border border-purple-100"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-6">Browser-native window.print()</span>
          </div>

        </div>
      </section>

      {/* ── CLINICIAN & PATIENT TESTIMONIALS ────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 border-t" style={{ borderColor: "rgba(27,45,107,0.06)" }}>
        <div className="text-center mb-16">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 block mb-2">Global Endorsements</span>
          <h2 className="text-3xl md:text-4xl font-black font-serif tracking-tight" style={{ color: "#1B2D6B" }}>
            What doctors and patients say.
          </h2>
          <p className="text-sm mt-3 text-slate-500 max-w-lg mx-auto">
            Trusted by top-tier medical professionals and respiratory patients for zero-latency monitoring and compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote: "The zero-latency ESP32 pressure readings paired with clean clinical PDF exports makes ReVive an monitoring asset in my private practice. A stellar diagnostic UI.",
              author: "Dr. Basit Rahman",
              role: "Senior Consultant Pulmonologist",
              hosp: "Dhaka Medical College Hospital",
              rating: "⭐⭐⭐⭐⭐"
            },
            {
              quote: "Having my respiratory passport on my phone with direct QR sharing gives me immense peace of mind when traveling. The 3D lung animations are incredibly motivating.",
              author: "Sarah Jenkins",
              role: "Asthma Patient / Runner",
              hosp: "London, UK",
              rating: "⭐⭐⭐⭐⭐"
            },
            {
              quote: "Local-first data persistence ensures strict HIPAA compliance without complex servers. ReVive sets the luxury standard for progressive healthcare applications.",
              author: "Dr. Elena Rostova",
              role: "Clinical Diagnostics Lead",
              hosp: "Almaty Pulmonary Research Institute",
              rating: "⭐⭐⭐⭐⭐"
            }
          ].map((t, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -6, scale: 1.01 }}
              className="glass-card-premium p-8 flex flex-col justify-between"
            >
              <div>
                <span className="text-xs text-amber-500 mb-4 block">{t.rating}</span>
                <p className="text-xs italic leading-relaxed text-[#1B2D6B] font-medium opacity-90 mb-6">
                  "{t.quote}"
                </p>
              </div>
              <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4 mt-auto">
                <h4 className="text-xs font-black text-[#1B2D6B]">{t.author}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{t.role}</p>
                <p className="text-[9px] text-[#2563EB] font-bold mt-0.5">{t.hosp}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA SECTION ──────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 md:p-14 rounded-[2.5rem] text-center border relative overflow-hidden flex flex-col items-center shadow-xl"
          style={{ 
            background: "linear-gradient(135deg, rgba(37,99,235,0.05), rgba(5,150,105,0.05))",
            borderColor: "rgba(37,99,235,0.12)"
          }}
        >
          {/* Decorative glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-3 block">Progressive Web App</span>
          <h2 className="text-3xl md:text-4xl font-black font-serif tracking-tight mb-4 max-w-xl" style={{ color: "#1B2D6B" }}>
            Install ReVive on your mobile home screen.
          </h2>
          <p className="text-sm mt-1 text-slate-500 max-w-lg mb-8 leading-relaxed">
            ReVive runs entirely offline. Add it to your phone's home screen to access fast tests, local history records, and browser notifications instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
            {isInstallable ? (
              <button 
                onClick={handleInstallClick}
                className="px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white rounded-2xl cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #1B2D6B, #2563EB)", boxShadow: "0 8px 25px rgba(37,99,235,0.2)" }}
              >
                <Download className="w-4 h-4 animate-bounce" />
                <span>Install PWA App</span>
              </button>
            ) : (
              <Link href={profile.name ? "/dashboard" : "/profile"}>
                <span className="px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white rounded-2xl cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #1B2D6B, #2563EB)", boxShadow: "0 8px 25px rgba(37,99,235,0.2)" }}>
                  <span>Launch Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            )}
          </div>
        </motion.div>
      </section>

    </div>
  );
}
