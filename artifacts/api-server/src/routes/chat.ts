import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-local-development",
});

function getMockReply(message: string): string {
  const msg = message.toLowerCase();
  
  if (msg.includes("emergency") || msg.includes("severe") || msg.includes("chest pain") || msg.includes("cannot breathe") || msg.includes("shortness of breath") || msg.includes("blood") || msg.includes("coughing up blood") || msg.includes("blue lips") || msg.includes("oxygen level low")) {
    return `### ⚠️ EMERGENCY WARNING
If you are experiencing severe shortness of breath, sudden chest pain, blue lips/fingertips, or are coughing up blood, please **seek immediate medical attention**. 
* **Call Emergency Services (103 in Kazakhstan)** or your local emergency line immediately.
* Go to the nearest emergency room.

Do not wait for AI advice in an emergency.`;
  }
  
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("greetings")) {
    return `Hello! I am your **ReVive AI Assistant** (currently running in offline/mock mode). 

I'm here to help you understand your spirometry numbers, guide you through breathing exercises, and explain lung health concepts. 

What would you like to discuss today?
1. **Spirometry Metrics** (FVC, FEV1, PEF, ratios)
2. **Breathing Exercises** (Pursed-lip, diaphragmatic)
3. **Air Quality Impacts** (AQI, PM2.5 details in Kazakhstan)
4. **ReVive Device** (How our differential pressure sensor and low-cost design work)`;
  }
  
  if (msg.includes("spirometry") || msg.includes("fev1") || msg.includes("fvc") || msg.includes("ratio") || msg.includes("pef") || msg.includes("metrics") || msg.includes("result")) {
    return `### Understanding Spirometry Metrics

Spirometry measures how much air you can inhale and exhale, and how quickly you can blow it out. Here are the core metrics ReVive tracks:

1. **FVC (Forced Vital Capacity):** The total volume of air (in liters) you can forcefully exhale after taking the deepest possible breath.
2. **FEV1 (Forced Expiratory Volume in 1 second):** The volume of air you blow out in the first second of that forced breath.
3. **FEV1/FVC Ratio:** The percentage of your total lung volume you can empty in the first second. 
   * *Normal range:* Typically 75% to 80% or higher for healthy adults.
   * *Obstructive pattern:* A ratio below 70% suggests airway obstruction (characteristic of asthma or COPD).
4. **PEF (Peak Expiratory Flow):** The maximum speed of your exhalation (in liters/minute or liters/second). It shows how open your airways are.

*Please note: These metrics are used for screening and trend monitoring. A formal diagnosis must always be made by a qualified healthcare professional.*`;
  }

  if (msg.includes("asthma") || msg.includes("copd") || msg.includes("bronchitis") || msg.includes("emphysema")) {
    return `### Asthma and COPD (Chronic Obstructive Pulmonary Disease)

Both asthma and COPD are obstructive lung diseases, meaning they cause narrowing or blockages in your airways:

* **Asthma:** A chronic condition where airways swell and narrow in response to triggers (like pollen, dust, or cold air). It is often reversible with bronchodilators (like albuterol). Spirometry tracks asthma control by showing improvements in FEV1 after medication.
* **COPD:** A progressive disease (typically caused by long-term smoking or pollutant exposure) that causes permanent lung damage. Spirometry is the gold standard for diagnosing COPD. An FEV1/FVC ratio $< 70\%$ post-bronchodilator is diagnostic of COPD.
* **Daily Tracking:** Regular exhalations with ReVive help track day-to-day fluctuations so you can adjust treatments before an exacerbation occurs.`;
  }

  if (msg.includes("exercise") || msg.includes("breathe") || msg.includes("breathing") || msg.includes("coach") || msg.includes("bubble")) {
    return `### Recommended Breathing Exercises

Regular breathing practice strengthens respiratory muscles. Try these two effective techniques:

1. **Pursed-Lip Breathing (Featured in our Education Coach):**
   * Inhale slowly through your nose for 2 seconds.
   * Purse your lips (as if about to whistle or blow out a candle).
   * Exhale gently and slowly through your pursed lips for 4 seconds (twice as long as the inhale).
   * *Benefit:* Keeps airways open longer, reducing shortness of breath.

2. **Diaphragmatic (Belly) Breathing:**
   * Place one hand on your chest and the other on your belly.
   * Inhale through your nose, making your belly rise (the hand on your chest should remain relatively still).
   * Exhale slowly through pursed lips while gently drawing your belly in.
   * *Benefit:* Engages the diaphragm fully, reducing the work of breathing.`;
  }

  if (msg.includes("aqi") || msg.includes("air quality") || msg.includes("pm2.5") || msg.includes("kazakhstan") || msg.includes("almaty") || msg.includes("karaganda") || msg.includes("dhaka") || msg.includes("bangladesh")) {
    return `### Air Quality & Respiratory Health: Dhaka & Kazakhstan

#### 🇧🇩 Dhaka, Bangladesh
Dhaka experiences some of the most challenging air quality globally, especially during the dry winter season (November to March). PM2.5 concentrations regularly reach "Very Unhealthy" or "Hazardous" levels (AQI > 200).
* **Key Drivers:** Brick kilns surrounding the city, heavy dust from building construction, exhaust from legacy diesel vehicles, and open refuse burning.
* **Health Impact:** Fine particulate matter goes deep into the alveoli, causing airway hyper-responsiveness. This triggers severe asthma flare-ups and accelerates COPD progression.

#### 🇰🇿 Kazakhstan (Almaty & Karaganda)
* **Karaganda:** Industrial activity, metallurgical smelting, and coal combustion release heavy particulate matter.
* **Almaty:** Located in a natural geographic bowl, winter emissions from coal-fueled heating (CHP plants) and vehicle exhausts get trapped close to the ground due to temperature inversion, forming thick, dangerous smog.

#### ⚠️ AQI Alert Guide (PM2.5):
* **0 - 50 (Good):** Great time for outdoor activities!
* **51 - 100 (Moderate):** Extremely sensitive individuals should consider reducing intense outdoor exertion.
* **101 - 150 (Unhealthy for Sensitive Groups):** People with asthma or COPD may start feeling symptoms; limit long outdoor exposure.
* **151 - 200 (Unhealthy):** Active children/adults and people with respiratory diseases should avoid prolonged outdoor exertion. Wear a protective respirator (N95/KF94) outside.
* **201+ (Very Unhealthy / Hazardous):** Everyone should avoid all outdoor physical activities. Run air purifiers indoors and keep windows closed.`;
  }

  if (msg.includes("device") || msg.includes("sensor") || msg.includes("differential") || msg.includes("hardware") || msg.includes("schematic")) {
    return `### ReVive Hardware & Spirometer Design

ReVive is engineered as a low-cost, open-source differential pressure spirometer:

1. **Differential Pressure Method:**
   * The device utilizes a constriction (orifice plate or venturi tube) in the breathing tube.
   * As you blow, air speeds up through the constriction, causing a pressure drop.
   * We measure the pressure difference (\\Delta P) between the wide entry and the narrow constriction using a high-precision differential pressure sensor (like the MPX5010DP or SDP810).
2. **Flow & Volume Calculation:**
   * Using Bernoulli's equation, flow rate (Q) is proportional to the square root of the pressure difference: Q = C * sqrt(\\Delta P).
   * We integrate the flow rate over time (V(t) = \\int Q(t) dt) to calculate total volume (FVC) and volume-time curves.
3. **Affordability:**
   * By using 3D-printed flow tubes and cheap off-the-shelf digital pressure sensors, ReVive can be manufactured for a fraction of the cost of commercial spirometers, increasing accessibility in low-resource settings.`;
  }

  return `I am your **ReVive AI Assistant**! 

I'm currently running in **Local Mock Mode** because no OpenAI API key is configured in this environment. However, I can still assist you with general knowledge.

You can ask me about:
* **Spirometry Metrics:** FVC, FEV1, Peak Flow, obstructive vs. restrictive curves.
* **Respiratory Diseases:** How asthma and COPD differ, and how they affect spirometry values.
* **Breathing Exercises:** Guidelines for pursed-lip or belly breathing exercises.
* **Air Quality (AQI):** How pollution in Dhaka, Almaty, or Karaganda affects lung health.
* **Hardware Schematics:** How our differential pressure sensor translates breathing pressure into flow curves.

How can I help you today?`;
}

router.post("/chat", async (req, res): Promise<void> => {
  const { message, history } = req.body;

  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const hasRealKey = process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith("dummy");

  if (!hasRealKey) {
    logger.info("Using mock chatbot response (OPENAI_API_KEY is missing or dummy)");
    res.json({ reply: getMockReply(message) });
    return;
  }

  const systemPrompt = `You are "ReVive AI Assistant", a friendly and supportive clinical respiratory assistant. 
Your purpose is to explain lung health concepts, spirometry metrics, and daily respiratory self-monitoring in clear, plain-English terms suitable for a non-medical person.

Important safety guidelines:
1. You are an AI assistant, not a doctor. Always include a gentle disclaimer if the user asks for direct medical diagnosis.
2. If the user describes severe symptoms (e.g. severe shortness of breath, blood in cough, chest pain, blue lips), urge them to seek immediate medical help or go to an emergency room.
3. Be encouraging and promote healthy habits (such as smoking cessation, checking air quality PM2.5 levels, and regular breathing exercises).
4. Frame answers to be concise, helpful, and organized.`;

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...(history || []).map((msg: any) => ({
      role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: msg.content,
    })),
    { role: "user" as const, content: message },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 800,
    });

    const reply = completion.choices[0]?.message?.content ?? "I am sorry, I could not process your request at this time.";
    res.json({ reply });
  } catch (err) {
    logger.warn({ err }, "Chatbot OpenAI request failed, falling back to mock reply");
    res.json({ reply: getMockReply(message) });
  }
});

export default router;
