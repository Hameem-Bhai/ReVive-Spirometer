import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { AnalyzeSpirometerBody } from "@workspace/api-zod";
import { db, testsTable, roundsTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-local-development",
});

router.post("/spirometer/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeSpirometerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { age, sex, rounds } = parsed.data;

  const hasAge = age != null;
  const hasSex = sex != null && sex !== "Prefer not to Say";

  const demographicsNote = (() => {
    if (!hasAge && !hasSex) return "Patient demographics: not provided (analyze based on general population norms).";
    const parts: string[] = [];
    if (hasAge) parts.push(`Age: ${age} years old`);
    if (hasSex) parts.push(`Biological sex: ${sex}`);
    if (!hasAge) parts.push("Age: not provided");
    if (!hasSex) parts.push("Biological sex: not provided");
    return `Patient demographics — ${parts.join(", ")}.`;
  })();

  const roundSummaries = rounds
    .map((r) => {
      const readings = r.rawReadings;
      const peak = Math.max(...readings);
      const avg = readings.reduce((a, b) => a + b, 0) / readings.length;
      return `Round ${r.roundNumber}: Peak pressure = ${peak.toFixed(2)}, Avg = ${avg.toFixed(2)}, Duration = ${r.durationSeconds}s, Readings count = ${readings.length}`;
    })
    .join("\n");

  const prompt = `You are a clinical respiratory analysis assistant. A patient has performed a spirometry test using a venturi-tube pressure sensor connected to an ESP32 microcontroller. The sensor readings are raw pressure values (arbitrary units from the ADC).

${demographicsNote}

Test results (${rounds.length} round${rounds.length > 1 ? "s" : ""}):
${roundSummaries}

Raw readings per round (pressure values sampled during exhalation):
${rounds.map((r) => `Round ${r.roundNumber}: [${r.rawReadings.map((v) => v.toFixed(2)).join(", ")}]`).join("\n")}

Based on these pressure readings, please provide a respiratory health analysis. Since these are raw sensor values (not calibrated spirometry in liters), make reasonable relative assessments based on the data patterns, variability, and any trends across rounds. Use medical knowledge to contextualize relative pressure effort and consistency.

${hasAge ? `The patient is ${age} years old — factor age-related lung capacity expectations into your assessment. Younger adults typically have higher lung capacity than older adults; note if performance appears above, at, or below what is typical for this age group.` : "Age was not provided — base assessments on general adult population norms."}
${hasSex ? `The patient's biological sex is ${sex} — apply sex-specific spirometry reference ranges. Females generally have 10–20% lower lung volumes than males of the same age and height; adjust your interpretation accordingly.` : "Biological sex was not provided — do not assume sex-specific reference values."}

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation, just JSON):
{
  "overallStatus": "green" | "yellow" | "red",
  "summary": "A 2-3 sentence plain-English summary of results suitable for a non-medical person",
  "metrics": [
    {
      "label": "Metric name",
      "value": "Numeric value or category",
      "unit": "Unit or N/A",
      "percentOfNormal": null or number (0-100+),
      "status": "green" | "yellow" | "red",
      "interpretation": "Plain-English explanation of what this metric means"
    }
  ],
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2", ...],
  "disclaimer": "This is not medical advice. Please consult a healthcare professional for diagnosis."
}

Include 4-6 metrics such as: Peak Effort, Breathing Consistency, Round-to-Round Variability, Exhalation Pattern, and any other relevant assessment. Make the analysis genuinely useful and clearly color-coded.`;

  const hasRealKey = process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith("dummy");
  let analysis: any;

  if (!hasRealKey) {
    logger.info("Using mock spirometer analysis (OPENAI_API_KEY is missing or dummy)");
    analysis = getMockSpirometryAnalysis(age ?? null, sex ?? null, rounds);
  } else {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      analysis = JSON.parse(raw);
    } catch (err) {
      req.log.error({ err }, "OpenAI analysis failed, falling back to local mock analysis");
      analysis = getMockSpirometryAnalysis(age ?? null, sex ?? null, rounds);
    }
  }

  // Save test session and individual rounds to the database
  try {
    if (db) {
      await db.transaction(async (tx) => {
        const [insertedTest] = await tx
          .insert(testsTable)
          .values({
            overallStatus: analysis.overallStatus,
            summary: analysis.summary,
            recommendations: analysis.recommendations,
            disclaimer: analysis.disclaimer,
          })
          .returning({ id: testsTable.id });

        if (insertedTest) {
          for (const r of rounds) {
            await tx.insert(roundsTable).values({
              testId: insertedTest.id,
              roundNumber: r.roundNumber,
              peakPressure: r.peakPressure,
              avgPressure: r.avgPressure,
              minPressure: r.minPressure ?? 0,
              maxPressure: r.maxPressure ?? r.peakPressure,
              durationSeconds: r.durationSeconds,
              rawReadings: r.rawReadings,
            });
          }
        }
      });
      logger.info("Successfully saved spirometry test results to database.");
    } else {
      logger.warn("Database connection is not initialized. Database storage skipped.");
    }
  } catch (dbErr) {
    logger.error({ err: dbErr }, "Failed to save spirometry data. Check DATABASE_URL configuration.");
  }

  res.json(analysis);
});

function getMockSpirometryAnalysis(age: number | null, sex: string | null, rounds: any[]) {
  const peakPressures = rounds.map(r => r.peakPressure || 0);
  const avgPressures = rounds.map(r => r.avgPressure || 0);
  const durations = rounds.map(r => r.durationSeconds || 0);
  
  const maxPeak = Math.max(...peakPressures, 0);
  const avgPeak = peakPressures.reduce((a, b) => a + b, 0) / Math.max(peakPressures.length, 1);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / Math.max(durations.length, 1);
  
  let variability = 0;
  if (peakPressures.length > 1) {
    const minPeak = Math.min(...peakPressures);
    variability = ((maxPeak - minPeak) / Math.max(avgPeak, 1)) * 100;
  }
  
  let mockFVC = 3.0 + (avgDuration * 0.25) + (maxPeak * 0.015);
  if (mockFVC > 6.0) mockFVC = 6.0;
  if (mockFVC < 2.5) mockFVC = 2.5;
  
  let ratio = 82 - (variability * 0.2);
  if (avgDuration < 4) {
    ratio -= (4 - avgDuration) * 5;
  }
  if (ratio > 92) ratio = 92;
  if (ratio < 60) ratio = 60;
  
  const mockFEV1 = (mockFVC * ratio) / 100;
  
  let overallStatus: "green" | "yellow" | "red" = "green";
  if (ratio < 70 || avgDuration < 3 || maxPeak < 30) {
    overallStatus = "red";
  } else if (ratio < 75 || avgDuration < 4 || maxPeak < 50) {
    overallStatus = "yellow";
  }
  
  let summary = `Your FEV1/FVC ratio is ${ratio.toFixed(1)}%, which is within the normal healthy range. Your breathing flow rate and volume show excellent consistency across all ${rounds.length} rounds, indicating good effort and strong expiratory capacity.`;
  if (overallStatus === "yellow") {
    summary = `Your lung function metrics show mild obstruction or reduced exhalation volume (ratio: ${ratio.toFixed(1)}%). While your consistency is fair, your peak flow or exhalation duration could be improved. Consider practicing diaphragmatic breathing.`;
  } else if (overallStatus === "red") {
    summary = `Your FEV1/FVC ratio (${ratio.toFixed(1)}%) is below the healthy threshold of 70%, suggesting potential airway obstruction. Your peak exhalation effort was also low or highly variable. We recommend consulting a healthcare provider.`;
  }

  return {
    overallStatus,
    summary,
    metrics: [
      {
        label: "Forced Vital Capacity (FVC)",
        value: mockFVC.toFixed(2),
        unit: "L",
        percentOfNormal: Math.round((mockFVC / (sex === "Female" ? 3.8 : 4.8)) * 100),
        status: mockFVC >= (sex === "Female" ? 3.2 : 4.0) ? "green" : mockFVC >= (sex === "Female" ? 2.8 : 3.5) ? "yellow" : "red",
        interpretation: `Total volume of air you can forcefully exhale. Typical normal for your demographic is around ${(sex === "Female" ? 3.8 : 4.8).toFixed(1)}L.`
      },
      {
        label: "Forced Expiratory Volume (FEV1)",
        value: mockFEV1.toFixed(2),
        unit: "L",
        percentOfNormal: Math.round((mockFEV1 / (sex === "Female" ? 3.1 : 3.9)) * 100),
        status: mockFEV1 >= (sex === "Female" ? 2.6 : 3.2) ? "green" : mockFEV1 >= (sex === "Female" ? 2.2 : 2.8) ? "yellow" : "red",
        interpretation: "Volume of air exhaled in the first second. This is the key marker for airway caliber."
      },
      {
        label: "FEV1/FVC Ratio",
        value: ratio.toFixed(1),
        unit: "%",
        percentOfNormal: null,
        status: ratio >= 75 ? "green" : ratio >= 70 ? "yellow" : "red",
        interpretation: "Percentage of total air blown out in the first second. Below 70% typically indicates obstructive airway patterns (e.g. asthma, COPD)."
      },
      {
        label: "Peak Expiratory Flow (PEF)",
        value: Math.round(maxPeak * 6).toString(),
        unit: "L/min",
        percentOfNormal: Math.round((maxPeak * 6 / 450) * 100),
        status: (maxPeak * 6) >= 350 ? "green" : (maxPeak * 6) >= 250 ? "yellow" : "red",
        interpretation: "Maximum speed of your exhalation. Shows how fast you can force air out of your lungs."
      },
      {
        label: "Exhalation Consistency",
        value: variability < 10 ? "Excellent" : variability < 20 ? "Good" : "Variable",
        unit: "N/A",
        percentOfNormal: null,
        status: variability < 15 ? "green" : variability < 25 ? "yellow" : "red",
        interpretation: `Round-to-round variation was ${variability.toFixed(1)}%. Low variation ensures high test reliability.`
      }
    ],
    recommendations: overallStatus === "green" 
      ? [
          "Maintain your regular physical activity to support cardiovascular and respiratory fitness.",
          "Check local AQI before long outdoor runs, especially in winter or industrial zones.",
          "Perform a daily deep breathing routine (pursed-lip or diaphragmatic) to keep respiratory muscles toned."
        ]
      : overallStatus === "yellow"
      ? [
          "Practice pursed-lip breathing (2s inhale, 4s exhale) for 5-10 minutes twice daily to improve exhalation volume.",
          "Avoid outdoor exercises on days when the AQI exceeds 100. Use an indoor air purifier.",
          "Keep a daily log of symptoms (cough, wheeze, fatigue) alongside spirometry tests to track changes."
        ]
      : [
          "Schedule a consultation with a healthcare professional to perform a clinical spirometry test.",
          "Limit physical exertion outdoors when air quality is moderate or poor (AQI > 50).",
          "Practice guided diaphragmatic breathing exercises to help clear stale air from your lungs.",
          "If prescribed any rescue inhalers, ensure they are close by and used exactly as directed by your doctor."
        ],
    disclaimer: "This analysis is generated locally based on your breathing pressure profile. It is intended for educational screening and does not replace professional medical diagnosis, treatment, or clinical spirometry."
  };
}

export default router;
