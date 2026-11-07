<div align="center">

<img src="docs/assets/revive-signal.gif" width="100%" alt="ReVive: stylized expanding lung shapes, flowing particles, and an illustrative scrolling signal" />

# ReVive — Spirometer Interface & Respiratory Data Prototype

### Explore the signal. Question the output.

A TypeScript workspace exploring browser-connected pressure inputs, simulated
sessions, respiratory-data visualization, and AI-assisted educational interfaces.

`React` · `TypeScript` · `Vite` · `Express` · `PostgreSQL` · `Drizzle`

[Overview](#from-sensor-input-to-screen) · [Demo modes](#understand-the-modes) · [Setup](#local-development) · [Architecture](#how-the-pieces-connect) · [Safety](#important-scope-and-safety)


## Recognition

### 1st Place — STEM Track
Young Asian Summit · Singapore · 2026

ReVive earned first place in the STEM track at the Young Asian Summit
in Singapore in 2026—a milestone in the project’s journey from an idea
to a working respiratory-tech prototype.

The recognition celebrates the project; it does not establish clinical
validation or regulatory approval.

</div>

---

## Important scope and safety

ReVive is an experimental software / hardware-interface prototype, not a clinically
validated diagnostic device. Do not use its displayed numbers, colour labels,
AI replies, reports, or calculators to diagnose disease, adjust medication, decide
whether care is needed, or replace professional spirometry.

The reviewed analysis route receives uncalibrated pressure readings. Its fallback
calculates mock FVC, FEV1, ratio, and peak-flow values with heuristic formulas.
Those outputs are demonstration values, not validated measurements of lung volume
or flow. Adding a real sensor or an AI API key does not make them clinically valid.

Use synthetic data to explore the application. The banner is illustrative artwork,
not physiological data, a test result, or an instruction for how to breathe.

## From sensor input to screen

ReVive brings together a staged test interface, browser device connections,
visual feedback, local history, and a backend analysis workflow. It explores how
a respiratory-data application could feel: guided screens, charts, family profiles,
report-oriented views, and an educational assistant in a single web experience.

Its strongest current use is software demonstration and interface development.
Any future measurement or clinical claims require separate hardware documentation,
calibration, validation, quality control, privacy engineering, and appropriate review.

## What you can explore

| Area | Visible implementation | Qualification |
| :--- | :--- | :--- |
| Session workflow | Round selection, demographic fields, staged timing, live pressure display | Fixed demo timing is not a claim of clinical test acceptability. |
| Simulation | Generated pressure-like samples | Synthetic, not patient measurements. |
| Serial input | Browser port selection, text-stream parsing, 115200 baud | Requires compatible browser, hardware, permissions, and firmware. |
| Bluetooth input | UART-style GATT notification path | Browser / OS support and matching service UUIDs required. |
| Feedback | Animated dial, particles, optional speech and vibration | Availability depends on browser capabilities. |
| Results | Analysis request, metric cards, recommendations, local-history save | Includes mock and AI-generated output, not validated diagnosis. |
| Other views | Dashboard, profile, family, clinician, patient-detail, calculator, education, chat | A page's presence does not prove clinical validation or secure multi-user access. |
| Progression | XP, streaks, and achievement-related code | Engagement features must not encourage unnecessary forced testing. |
| Persistence | Browser localStorage plus optional PostgreSQL test/round writes | Browser state and server records are separate. |

The existing project description also mentions AQI, lung-age calculations, and
printable evaluation reports. Those need their own formula, provenance, and
workflow review before being presented as verified clinical capabilities.

## Understand the modes

There are two independent choices: where samples come from and how output is generated.

| Layer | Mode | What happens |
| :--- | :--- | :--- |
| Input | Simulation | The frontend generates numeric samples. |
| Input | Serial or Bluetooth | The frontend collects numbers sent by a device. |
| Analysis | Local mock fallback | Missing/dummy AI key, or an AI request failure, invokes heuristic results. |
| Analysis | OpenAI-backed | Raw readings and supplied demographics are sent to the provider for generated text/JSON. |
| Storage | No `DATABASE_URL` | The reviewed DB client is null and server-side test persistence is skipped. |
| Storage | PostgreSQL configured | The route attempts a transaction saving test and round records. |

These are not equivalent to calibrated measurement modes. Hardware input can
still produce mock analysis. AI failure can silently fall back to mock analysis
from the user's perspective; make the output source explicit before any broader use.

## How the pieces connect

```text
Simulation / serial text / BLE notifications
                    |
                    v
React session workflow + live pressure UI
                    |
                    v
Generated API hooks / shared request validation
                    |
                    v
Express /api/spirometer/analyze
          |                         |
          v                         v
Local heuristic fallback     Optional OpenAI request
          |                         |
          +------------+------------+
                       v
               Result interface
              /                Browser local history     Optional PostgreSQL writes
```

A frontend history flag records simulated input. The reviewed analysis request
contains demographics and rounds, not an explicit simulation-provenance field.
Preserve source, units, timing, calibration version, and output mode end-to-end
before combining sessions in reports or trend views.

<details>
<summary>Workspace map and technology</summary>

```text
ReVive-Spirometer/
├── artifacts/
│   ├── spirometer/           React / Vite frontend
│   ├── api-server/           Express API
│   └── mockup-sandbox/       Separate workspace artifact
├── lib/
│   ├── api-client-react/     Shared/generated React API client
│   ├── api-spec/             API contract / code generation
│   ├── api-zod/              Shared runtime validation
│   └── db/                   Drizzle + PostgreSQL
├── scripts/
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── package.json
└── docs/assets/revive-signal.gif  # Supplied by this README pack
```

The workspace uses React, TypeScript, Vite, Tailwind, Framer Motion, Recharts,
TanStack Query, Express, Zod, Drizzle, PostgreSQL, and the OpenAI SDK. Package scripts
and source files—not a stack badge—are the reference for what is actually wired up.

</details>

## Local development

### Prerequisites and portability warning

Repository notes specify Node.js 24. Install Node.js and pnpm before continuing.
The repository does not currently pin a pnpm version in the root manifest.

The checked-in workspace configuration includes Linux-oriented native-package
exclusions, while the root manifest explicitly adds Windows x64 native packages.
It also contains an `allowBuilds` value that is placeholder text rather than a
boolean. These can cause installation failures depending on OS and pnpm version.
A cross-platform clean install has not been verified for this guide.

If installation fails, inspect these package rules in a separate branch. Preserve
supply-chain controls such as the minimum release age; do not disable checks or
force arbitrary binaries just to bypass an error.

### 1. Clone and install

```bash
git clone https://github.com/Hameem-Bhai/ReVive-Spirometer.git
cd ReVive-Spirometer
pnpm install --frozen-lockfile
```

Resolve lockfile or platform errors deliberately; the README does not change the
existing manifests or lockfile.

### 2. Build and start the API — terminal one

The API requires `PORT`; it does not silently default to 5000. Build before using
`start`, since that script launches `dist/index.mjs`.

Windows PowerShell:

```powershell
$env:PORT="5000"
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
```

macOS / Linux shell:

```bash
export PORT=5000
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
```

Leave `OPENAI_API_KEY` and `DATABASE_URL` unset for an initial synthetic-data demo.
The reviewed analysis route supports local fallback and skips DB writes when no
connection is configured. This is not a guarantee that every page works without DB.

The API `dev` script uses shell `export`, which is not portable to Windows' default
script shell. The explicit build/start procedure above avoids that particular issue.

### 3. Start the frontend — terminal two

In a new terminal at the repository root, make sure `PORT` is unset or set to `3000`:

```bash
pnpm --filter @workspace/spirometer run dev
```

Open http://localhost:3000. Vite defaults to port 3000 and proxies `/api` to
`http://localhost:5000`. Avoid inheriting `PORT=5000` in this terminal, or the two
servers will compete for a port.

The development configuration binds to `0.0.0.0` and permits hosts broadly. Use
only in a trusted development environment; do not expose an unreviewed health-data
prototype publicly.

<details>
<summary>Optional PostgreSQL persistence</summary>

Create a disposable development PostgreSQL database and set `DATABASE_URL` in the
terminal running schema commands and the API. Do not use a production database.

PowerShell example:

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
pnpm --filter @workspace/db run push
```

POSIX shell example:

```bash
export DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/DATABASE'
pnpm --filter @workspace/db run push
```

Inspect the proposed schema changes before accepting them. `push` changes the
database schema; do not use the force variant as a routine fix. Restart the API
with the same connection environment afterward.

Saving errors are logged and the analysis route can still return output; a result
screen does not confirm that the session was saved successfully.

</details>

<details>
<summary>Optional AI integration and data handling</summary>

Set `OPENAI_API_KEY` only in the API process environment. Do not add it to frontend
code, screenshots, issue reports, or a committed environment file.

PowerShell:

```powershell
$env:OPENAI_API_KEY="YOUR_LOCAL_SECRET"
```

POSIX shell:

```bash
export OPENAI_API_KEY='YOUR_LOCAL_SECRET'
```

The reviewed routes use `gpt-4o`. Provider access, model availability, charges, and
network connectivity are separate requirements. A valid API key is not a clinical
validation step.

Analysis requests send raw readings and supplied demographic fields to the
provider. Chat requests send the message and conversation history. Obtain suitable
consent and review retention, access, and privacy requirements before using any
real health information. Prefer synthetic fixtures during development.

The mock chatbot contains preset medical statements and location-specific content;
it is not a medically reviewed knowledge source. Do not rely on either mode for
emergency triage, diagnosis, or treatment changes.

</details>

## Browser-device interface notes

The serial path opens at `115200` baud and parses newline-delimited text. It accepts
a plain numeric line or extracts the number after `Pressure:` from a longer line.

Example payloads—not calibrated pressure or flow values:

```text
123.45
Raw: 1234 | Voltage: 1.23V | Pressure: 0.45 kPa
```

The parser extracts numbers but does not consistently convert or carry the units.
The display and analysis therefore must not assume the two example formats share
one scale.

The Bluetooth path uses a UART-style service and notification characteristic:

```text
Service:        6e400001-b5a3-f393-e0a9-e50e24dcca9e
Characteristic: 6e400003-b5a3-f393-e0a9-e50e24dcca9e
```

These are expected interface identifiers, not a guarantee of compatibility with
any Bluetooth sensor. Document your actual firmware and hardware separately.
Browser support, secure-context requirements, permissions, and device availability
must be checked for the target platform. Simulation avoids requiring physical input.

This documentation pack does not supply a hardware build guide, firmware,
calibration procedure, electrical safety review, or infection-control protocol.

## What needs to improve next

1. Label all simulation, mock, AI-generated, and hardware-derived output visibly
   and preserve those labels in API responses, history, and exported reports.
2. Remove clinical-looking numeric outputs from uncalibrated fallback data, or
   label them permanently as synthetic demonstration fixtures.
3. Define pressure units, sample timestamps/rate, sensor zeroing, conversion,
   calibration, and measurement-quality checks before any volume/flow claims.
4. Validate against appropriate reference equipment and publish methods, error
   bounds, limitations, and test conditions before making accuracy claims.
5. Audit patient/profile ownership, clinician access, logging, retention, consent,
   and external-provider data flows before handling health records.
6. Ensure AI/mock emergency messaging is appropriately localized and never delays
   urgent care. Remove treatment-adjustment claims from canned responses.
7. Make XP/streak rewards about safe software exploration, not pressure to perform
   repeated forced maneuvers or unsupported claims of improved lung strength.
8. Repair and test clean installs across the intended operating systems.

Clinical spirometry standardization requires equipment quality assurance and
calibration verification. A styled report or plausible-looking chart does not
establish measurement validity. See the official [ATS/ERS spirometry technical
statement](https://pmc.ncbi.nlm.nih.gov/articles/PMC6794117/) for context, not as a
claim that this project meets that standard.

## Development checks

From the workspace root:

```bash
pnpm run typecheck
pnpm run build
```

The root build includes typechecking and recursive workspace builds. A successful
compile is not a functional test, device-compatibility test, or medical validation.
No passing CI result, coverage percentage, accuracy figure, or regulatory status
is asserted in this README.

For changes, test disconnected-device handling, partial serial/BLE chunks, empty
and invalid input, timestamp handling, AI failure, DB failure, and persistent
provenance across reports. Use synthetic records and separate demo fixtures.

## Contributing

Open focused issues and pull requests with reproducible steps and expected
behavior. Include OS/browser and package versions when relevant. Never attach
identifiable health records, API keys, database credentials, or device logs with
personal information.

Medical claims, risk thresholds, and patient-facing guidance require appropriate
expert review, not only code review.

## License status

The root package declares `MIT`, but no standalone LICENSE appeared in the reviewed
root listing. Add the intended license text and copyright notice to make reuse
terms explicit. Third-party packages and any future hardware designs may have
separate terms.

---

<div align="center">

Built by [Hameem](https://github.com/Hameem-Bhai).

**Thoughtful interfaces. Transparent limitations. Better questions.**

</div>
