/**
 * ConfettiBlast.tsx — Canvas-based confetti celebration + Achievement card
 */
import React, { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Share2 } from "lucide-react";

interface Props {
  show: boolean;
  title: string;
  subtitle: string;
  value?: string;
  onClose: () => void;
}

export function ConfettiBlast({ show, title, subtitle, value, onClose }: Props) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!show || firedRef.current) return;
    firedRef.current = true;

    // Navy + gold + emerald confetti to match brand
    const colors = ["#1B2D6B", "#D97706", "#059669", "#3B82F6", "#F59E0B", "#ffffff"];

    const burst = () => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6, x: 0.5 },
        colors,
        disableForReducedMotion: true,
      });
    };

    burst();
    setTimeout(burst, 300);
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors,
        disableForReducedMotion: true,
      });
    }, 600);

    return () => { firedRef.current = false; };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm"
        >
          <div className="relative rounded-3xl p-6 text-center overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1B2D6B, #1e3a8a)",
              boxShadow: "0 20px 60px rgba(27,45,107,0.4)",
            }}>
            {/* Gold shimmer top */}
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl"
              style={{ background: "linear-gradient(90deg, transparent, #D97706, #F59E0B, #D97706, transparent)" }} />

            {/* Star icon */}
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(217,119,6,0.2)", border: "2px solid rgba(217,119,6,0.4)" }}>
              <Star className="w-7 h-7 fill-current" style={{ color: "#F59E0B" }} />
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: "#F59E0B" }}>Achievement Unlocked</p>
            <h3 className="text-xl font-black text-white tracking-tight mb-1">{title}</h3>
            <p className="text-sm mb-2" style={{ color: "#93c5fd" }}>{subtitle}</p>
            {value && (
              <div className="inline-block px-4 py-1.5 rounded-full text-2xl font-black text-white mb-3"
                style={{ background: "rgba(5,150,105,0.25)", border: "1px solid rgba(5,150,105,0.4)" }}>
                {value}
              </div>
            )}

            <div className="flex gap-2 justify-center mt-2">
              <button onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
                style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>
                <X className="w-3.5 h-3.5" /> Dismiss
              </button>
            </div>

            {/* Close button */}
            <button onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg cursor-pointer transition-all"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
