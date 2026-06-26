/**
 * DailyInsight.tsx — Rotating daily lung health fact card
 */
import React from "react";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

const FACTS = [
  { fact: "Your lungs contain about 300 million alveoli — tiny air sacs that provide a surface area the size of a tennis court for gas exchange.", category: "Anatomy" },
  { fact: "The average adult breathes around 20,000 times per day, moving approximately 11,000 liters of air through the lungs.", category: "Stats" },
  { fact: "Pursed-lip breathing — exhaling slowly through pursed lips — can increase oxygen saturation by 2–3% during COPD flare-ups.", category: "Tip" },
  { fact: "PM2.5 particles (smaller than 2.5µm) can penetrate deep into alveoli, bypassing the nose's natural filtration system entirely.", category: "Air Quality" },
  { fact: "The FEV1/FVC ratio dropping below 70% post-bronchodilator is the gold standard criterion for diagnosing COPD.", category: "Clinical" },
  { fact: "Diaphragmatic breathing activates the parasympathetic nervous system, reducing cortisol and lowering resting heart rate within minutes.", category: "Tip" },
  { fact: "A healthy adult lung can hold about 6 liters of air at maximum capacity — roughly the same volume as 3 standard soda bottles.", category: "Stats" },
  { fact: "The right lung has 3 lobes; the left lung has only 2 — to make room for the heart.", category: "Anatomy" },
  { fact: "Breathing through the nose warms and humidifies air and filters particles up to 10µm — far superior to mouth breathing.", category: "Tip" },
  { fact: "Indoor air can be 2–5x more polluted than outdoor air due to cleaning products, furniture off-gassing, and poor ventilation.", category: "Air Quality" },
  { fact: "Peak lung function is typically reached between ages 20–25, then gradually declines about 1% per year after 35.", category: "Clinical" },
  { fact: "Regular aerobic exercise can slow the natural decline in FEV1 by up to 50% compared to sedentary individuals.", category: "Tip" },
  { fact: "The Buteyko Method — reducing breathing volume to raise CO₂ slightly — has clinical evidence for reducing asthma medication use.", category: "Clinical" },
  { fact: "Over 65 million people worldwide have moderate to severe COPD, yet more than 70% are undiagnosed.", category: "Stats" },
  { fact: "Box breathing (4s inhale, 4s hold, 4s exhale, 4s hold) is used by U.S. Navy SEALs to maintain calm under extreme stress.", category: "Tip" },
  { fact: "The cilia lining your airways beat 1,000 times per minute to move a layer of mucus toward the throat, trapping debris.", category: "Anatomy" },
  { fact: "Asthma affects 262 million people globally, making it one of the most common chronic diseases in both children and adults.", category: "Stats" },
  { fact: "An AQI above 150 triggers measurable drops in peak expiratory flow rate (PEFR) even in healthy, non-asthmatic adults.", category: "Air Quality" },
  { fact: "The 4-7-8 breathing technique (4s inhale, 7s hold, 8s exhale) can induce sleep within 60 seconds by triggering the vagal reflex.", category: "Tip" },
  { fact: "Spirometry is the most reproducible, standardized test in all of pulmonary medicine — even more reliable than blood tests for many lung diseases.", category: "Clinical" },
  { fact: "Singing, playing wind instruments, and swimming all strengthen respiratory muscles and have been shown to improve FEV1 over time.", category: "Tip" },
  { fact: "The trachea (windpipe) is not rigid — it flexes and narrows during exhalation, a process called dynamic airway compression.", category: "Anatomy" },
  { fact: "Mouth breathing during sleep leads to reduced nitric oxide production, lower blood oxygen levels, and increased snoring frequency.", category: "Tip" },
  { fact: "Household plants like snake plants and peace lilies can remove VOCs from indoor air, though the effect is modest without proper ventilation.", category: "Air Quality" },
  { fact: "Inhaling through the nose produces 25% more oxygen uptake than mouth breathing due to nitric oxide from the nasal passages.", category: "Tip" },
  { fact: "The diaphragm is responsible for 70–80% of each breath's work. Weak diaphragm muscles are a key indicator of respiratory disease.", category: "Clinical" },
  { fact: "High-altitude environments (above 2,500m) trigger a response called hypoxic ventilatory response — your body breathes faster to compensate for less oxygen.", category: "Stats" },
  { fact: "Air pollution causes an estimated 7 million premature deaths per year globally — more than AIDS, tuberculosis, and malaria combined.", category: "Air Quality" },
  { fact: "Laughter is a powerful breathing exercise — a single belly laugh uses up to 40 different respiratory and abdominal muscles.", category: "Tip" },
  { fact: "The concept of \"lung age\" — comparing your FEV1 to an expected value for your biological age — is proven to motivate smokers to quit.", category: "Clinical" },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Anatomy":    { bg: "rgba(59,130,246,0.08)",  text: "#2563EB",  border: "rgba(59,130,246,0.2)"  },
  "Stats":      { bg: "rgba(124,58,237,0.08)",  text: "#7c3aed",  border: "rgba(124,58,237,0.2)"  },
  "Tip":        { bg: "rgba(5,150,105,0.08)",   text: "#059669",  border: "rgba(5,150,105,0.2)"   },
  "Air Quality":{ bg: "rgba(217,119,6,0.08)",   text: "#D97706",  border: "rgba(217,119,6,0.2)"   },
  "Clinical":   { bg: "rgba(27,45,107,0.07)",   text: "#1B2D6B",  border: "rgba(27,45,107,0.15)"  },
};

export function DailyInsight() {
  // Deterministically pick a fact based on calendar day
  const todayIndex = Math.floor(Date.now() / 86400000) % FACTS.length;
  const { fact, category } = FACTS[todayIndex];
  const catStyle = CATEGORY_COLORS[category] || CATEGORY_COLORS["Clinical"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(27,45,107,0.04) 0%, rgba(59,130,246,0.04) 100%)",
        border: "1px solid rgba(27,45,107,0.08)",
        boxShadow: "0 4px 20px rgba(27,45,107,0.06)",
      }}
    >
      {/* Decorative top stripe */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: "linear-gradient(90deg, #1B2D6B, #3B82F6, #059669)" }} />

      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: "rgba(27,45,107,0.08)", border: "1px solid rgba(27,45,107,0.12)" }}>
          <Lightbulb className="w-4 h-4" style={{ color: "#D97706" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "#1B2D6B" }}>
              Did You Know?
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: catStyle.bg, color: catStyle.text, border: `1px solid ${catStyle.border}` }}>
              {category}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{fact}</p>
        </div>
      </div>
    </motion.div>
  );
}
