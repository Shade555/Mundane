# Mundane — An Open-Source AI Field Investigator

> **Tagline:** *"The world is full of things you've never really noticed."*  
> **Mission:** *"I built AI to help people pay attention to the world, not pay more attention to their screens."*  
> **Event:** Hacktoberfest 2026 Open-Source AI Challenge (Week 1 Submission)  
> **License:** Apache 2.0  

---

## 1. What is Mundane?

**Mundane** is an AI-powered outdoor field investigation companion. It turns ordinary, everyday real-world observations into rigorous, small-scale scientific inquiries.

### What it is NOT:
- ❌ Not a Pokémon GO clone or map-based collectible game.
- ❌ Not a generic chatbot with a leafy outdoors skin.
- ❌ Not a hiking or fitness mileage tracker.
- ❌ Not an app designed to artificially maximize screen time with addictive streaks or badges.

### Core Philosophy
The purpose of technology in nature should be to **encourage people to put their screens away, observe physical reality, form hypotheses, gather empirical evidence, and return with a deeper understanding of the world.**

Mundane strictly distinguishes between:
1. **Directly observable empirical evidence** (textures, colors, fractures, moisture traces).
2. **Reasonable deductions & interpretations**.
3. **Competing alternative hypotheses**.
4. **Information that cannot be determined** without microscopic, laboratory, or longitudinal assays.

It **never** presents an AI guess as a scientifically proven fact.

---

## 2. Key Features

- **Screen 1: The Field Desk** — Editorial naturalist dashboard presenting active inquiries, natural progress tracking, local vs cloud sync indicators, and verified AI runtime health.
- **Screen 2: Investigation Setup** — Formulate inquiries from curiosity prompts or photo uploads with environmental context (sunlight, substrate, precipitation, wind).
- **Screen 3: The Field Investigation** — Step-by-step field procedure with a dedicated **"Continue Outdoors Mode"** (distraction-free, high-contrast sunlight view encouraging users to put their phone in their pocket between steps).
- **Screen 4: Grounded Clue Analysis** — Multi-category evidence breakdown that separates tangible facts from inferences and recommends safe next outdoor checks.
- **Screen 5: Hypothesis Testing Matrix** — Compare user-proposed and model-suggested explanations against gathered clues to evaluate whether hypotheses are *Supported*, *Plausible but Unverified*, *Inconclusive*, or *Contradicted*.
- **Screen 6: Persistent Field Journal Dossier** — Complete scientific audit log with editable naturalist reflections, photo attachments, and one-click Markdown field report exports.
- **Model Runtime & Prompt Inspector** — Full transparency dashboard reporting inference endpoint, VRAM/CPU execution, and versioned prompt templates.
- **Deterministic Outdoor Safety Engine** — Enforces "Leave No Trace", preventing instructions that encourage handling unknown fungi, tasting wild plants, disturbing wildlife, or trespassing.

---

## 3. Architecture & Tech Stack

```
Mundane Architecture
┌────────────────────────────────────────────────────────┐
│             Next.js 15 App Router Frontend             │
│   (TypeScript, Tailwind CSS, Lucide, High-Contrast UI) │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌─────────────────────────┐ ┌─────────────────────────┐
│ Server Route Handlers   │ │ Storage Adapter         │
│ - /api/ai/health        │ │ - PostgreSQL / Supabase │
│ - /api/ai/generate      │ │   (with RLS policies)   │
│ - /api/ai/analyze-obs   │ │ - Offline Local Storage │
│ - /api/ai/test-hypo     │ │   (Private, in-browser) │
│ - /api/ai/synthesize    │ └─────────────────────────┘
└────────────┬────────────┘
             │
┌────────────▼────────────────────────────────────────┐
│  Mastra Agent Coordinator & Zod Validation Engine    │
│  - FieldProcedureSafetyValidator                    │
│  - Multi-hypothesis evidence evaluator              │
│  - Scientific uncertainty synthesizer               │
└────────────────────────────┬────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────┐
│       Open-Weight AI Inference Layer (Ollama)       │
│  - Text Reasoning: Google Gemma 2 2B (Fast CPU)     │
│  - Vision Analysis: Google Gemma 12B Vision Model   │
└─────────────────────────────────────────────────────┘
```

### Stack Highlights
- **Framework**: Next.js 15.3.9 (App Router)
- **Language**: TypeScript (strict type-checking)
- **Styling**: Tailwind CSS with custom natural editorial palette (`paper`, `forest`, `charcoal`, `botanical`)
- **Agent Orchestration**: `@mastra/core` for structured investigation coordination
- **Validation**: Strict Zod schemas with JSON grammar constraints
- **Database**: Supabase PostgreSQL with Row Level Security (RLS) migrations + honest offline local mode
- **Testing**: Vitest test runner (27 automated unit, provider, and E2E acceptance tests)

---

## 4. Prerequisites & Setup

### Requirements
- **Node.js**: v20+ (tested on Node v24.12.0)
- **Ollama**: Installed locally ([Download Ollama](https://ollama.com))

### 1. Download Open-Weight Gemma Models
Run the following in your terminal:

```bash
# Fast text and hypothesis reasoning (1.6 GB, optimized for CPU/GPU)
ollama pull gemma2:2b

# Vision analysis for field photos (multimodal)
ollama pull gemma4:12b
```

Verify your models are available:
```bash
ollama list
```

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/Mundane.git
cd Mundane
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Default local configuration in `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma2:2b
OLLAMA_VISION_MODEL=gemma4:12b

# Optional: Supabase for multi-device cloud persistence
# If left blank, Mundane operates in honest local offline-first mode
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Database Setup (Optional Supabase Cloud Mode)

Mundane is **100% functional offline** out of the box using private browser storage. If you want multi-device synchronization:

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the Supabase SQL Editor and execute the migration file:
   `supabase/migrations/20261011000000_init.sql`
3. Copy your Project URL and Anon Public Key into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```
4. Row Level Security (RLS) is automatically enabled on `investigations`, `observations`, and `hypotheses`.

---

## 6. Running Tests

Mundane includes automated unit, schema, safety, and live end-to-end acceptance tests:

```bash
# Run unit & schema tests (Instant)
npm test -- tests/safety.test.ts tests/schemas.test.ts tests/json-extractor.test.ts tests/storage.test.ts tests/ai-provider.test.ts

# Run the complete test suite including the 13-step live model journey
npm test -- --testTimeout=240000
```

### Test Coverage Summary (27 passing tests)
- `tests/safety.test.ts` (6 tests) — Deterministic outdoor hazard patterns (toxic plants, mushrooms, traffic, trespassing).
- `tests/json-extractor.test.ts` (4 tests) — Structured JSON parsing with code fence and thinking token stripping.
- `tests/schemas.test.ts` (5 tests) — Strict Zod validation for inputs, outputs, and evidence categorization.
- `tests/ai-provider.test.ts` (2 tests) — Real Ollama health checks and graceful offline error reporting.
- `tests/storage.test.ts` (4 tests) — Record creation, observation appending, hypothesis updates, and deletion.
- `tests/e2e-workflow.test.ts` (6 tests) — Mandatory 13-step end-to-end journey executed live against the local model.

---

## 7. Mandatory 13-Step Acceptance Test Journey

The application was verified against the full Hacktoberfest acceptance protocol:

1. **Start application** & check `/api/ai/health`.
2. **Confirm AI runtime** (`gemma2:2b` via Ollama) is healthy.
3. **Generate an investigation** grounded in observable phenomena (*Plantain in pavement seams vs Dandelion in lawn*).
4. **Review field procedure** with Leave-No-Trace safety considerations.
5. **Record a real observation** with environmental context.
6. **Submit evidence** to the investigation dossier.
7. **Receive AI analysis** separating direct evidence, deductions, and alternative explanations.
8. **Form or revise a hypothesis** (*Flat rosette morphology resists mechanical trampling*).
9. **Review alternative explanations** and evaluate evidence.
10. **Produce a conclusion** with explicit scientific uncertainty via Mastra coordinator.
11. **Save the investigation** into the persistent storage adapter.
12. **Reopen the Field Journal** and confirm persistence.
13. **Resume the investigation** and verify all recorded evidence and notes are retained intact.

---

## 8. Deployment (Render & Cloud Hosting)

### Deploying Frontend on Render
1. Create a **Web Service** on [Render](https://render.com) connected to your repository.
2. Build Command: `npm install && npm run build`
3. Start Command: `npm run start`
4. Set Environment Variables:
   - `NEXT_PUBLIC_APP_URL`: Your Render service URL
   - `REMOTE_INFERENCE_URL`: The public HTTPS endpoint of your hosted Ollama or remote model runtime
   - `REMOTE_INFERENCE_API_KEY`: Optional Bearer token if your inference endpoint requires auth

> **Deployment Rule**: Installing the web app on Render does not automatically make your local laptop's Ollama model available. You must either provide a remote inference endpoint in `REMOTE_INFERENCE_URL` or run Mundane locally for 100% private, on-device investigations.

---

## 9. Hacktoberfest Demo Script

1. **Open The Field Desk (`/`)**: Show the editorial dashboard, runtime status pill (`gemma2:2b` via Ollama), and storage mode (`Local Storage (Offline)`).
2. **Select an Observation Idea**: Click *"Pavement Fracture Botany"* or enter what you notice outside your window.
3. **Launch Setup (`/investigate/new`)**: Show how environmental setting tags (sunlight, surface, recent rain) are collected without GPS tracking.
4. **Enter Field Mode (`/investigate/[id]`)**: Toggle *"Continue Outdoors Mode"* to show the high-contrast, distraction-free view designed to be legible in sunlight while putting the screen away.
5. **Record Evidence & Analyze**: Submit an observation note and inspect the 5-point scientific breakdown (directly visible vs deductions vs what cannot be proven).
6. **Evaluate Hypotheses**: Click *"Evaluate against field clues"* to test competing explanations.
7. **Conclude & Archive**: Click *"Conclude & Archive to Journal"*. Mastra coordinates the synthesis with explicit uncertainty tags.
8. **Inspect Field Dossier (`/journal/[id]`)**: Review the full audit trail, add personal naturalist reflections, and click *"Export Report"* to copy the Markdown dossier.
9. **Model Transparency (`/settings`)**: Demonstrate the Prompt Inspector and open-weight licensing terms.
