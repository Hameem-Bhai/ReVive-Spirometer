# ReVive — At-Home Lung Diagnostics & Spirometry

ReVive is an open-source, low-cost differential pressure spirometry platform designed for at-home screening, early detection, and monitoring of chronic respiratory conditions such as COPD and asthma. 

The system features real-time spirometry testing, AQI monitoring, and an AI-powered pulmonology assistant.

## 🏥 Key Features

- **Spirometry Testing**: Real-time measurement of key lung function parameters including FVC, FEV1, and FEV1/FVC Ratio.
- **City General Hospital Template**: Premium printable and viewable spirometry evaluation reports.
- **AI Pulmonologist Chatbot**: Interactive guidance and clinical interpretation assistant.
- **Family Mode**: Supports profiles for up to 5 family members on a single device.
- **Lung Age & AQI Calculators**: Standard equations for diagnostic predictions.
- **Educational Portal**: Up-to-date resources on lung hygiene, inhaler techniques, and air quality indexes.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, Lucide React, Framer Motion, Recharts.
- **Backend API**: Node.js, Express, PostgreSQL, Drizzle ORM, Zod validation.

---

## 🚀 How to Run Locally

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run the Development Servers
* Run the **API server** (starts on port 5000):
  ```bash
  pnpm --filter @workspace/api-server run start
  ```
* Run the **Vite frontend app** (starts on port 3000):
  ```bash
  pnpm --filter @workspace/spirometer run dev
  ```
