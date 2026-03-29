# NeuroCast

**An AI-powered neuro-adaptive podcast that generates a unique audio experience based on your current mental state.**

NeuroCast reads three neuroscience-grounded inputs — Arousal, Valence, and Attention — detects your mood, and generates a fully produced podcast episode: an original story, narrated by distinct voices, with contextual sound effects and mood-matched background music, all mixed into a single audio file.

---

## Features

- **Mood detection** from three neural axes (Arousal, Valence, Attention) mapped to 8 states: Anxious, Wired, Euphoric, Flow State, Hyper-focused, Burnt Out, Dreamy, Balanced
- **AI-generated scripts** via an ElevenLabs Conversational Agent — unique story every time, with fallback to pre-written scripts if the agent is unavailable
- **Multi-voice narration** — separate host and narrator voices via ElevenLabs TTS
- **Contextual sound effects** — scene-matched SFX generated per narrator segment via ElevenLabs Sound Effects API
- **Mood-matched background music** — generated via ElevenLabs Sound Effects API, mixed under the host intro only
- **Full audio mixing** — all segments, SFX, and music are decoded and mixed in the browser using the Web Audio API, exported as a single WAV file
- **Play / Pause / Replay** controls with a progress bar and click-to-seek
- **Live brainwave visualizer** — animated canvas showing Alpha, Beta, Theta, and Delta activity responding to slider input

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript |
| Audio | Web Audio API (OfflineAudioContext, WAV export) |
| Visualizer | Canvas API |
| TTS | ElevenLabs Text-to-Speech API |
| Music & SFX | ElevenLabs Sound Effects API |
| Script Generation | ElevenLabs Conversational AI Agent |
| Proxy Server | Node.js (built-in `http`, `https`, `fs`, `path` — no npm dependencies) |
| Fonts | Google Fonts (Syne, Space Mono) |

---

## Project Structure

```
neurocast/
├── neurocast.html   # App structure — no inline CSS or JS
├── styles.css       # All styling and animations
├── app.js           # All logic: mood detection, audio generation, mixing, player
├── server.js        # Local proxy server — forwards API calls to ElevenLabs
└── README.md
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- An [ElevenLabs](https://elevenlabs.io) account and API key

### Setup

1. Clone or download all files into the same folder
2. Open `app.js` and replace the `EL_KEY` constant with your ElevenLabs API key:
   ```js
   const EL_KEY = 'your_elevenlabs_api_key_here';
   ```
3. *(Optional)* To enable AI-generated scripts, create an ElevenLabs Conversational Agent:
   - Go to [elevenlabs.io/app/conversational-ai](https://elevenlabs.io/app/conversational-ai)
   - Create a new agent with this system prompt:
     ```
     You are a podcast script writer for NeuroCast, a neuro-adaptive podcast.
     When given a listener's mood and neural state, write a short ~60-second podcast
     episode. Respond ONLY with raw JSON, no markdown:
     {"title":"...","segments":[{"role":"host","text":"..."},{"role":"narrator","text":"..."},{"role":"narrator","text":"..."},{"role":"host","text":"..."}]}
     ```
   - Copy the Agent ID and update `AGENT_ID` in `app.js`

4. Start the server:
   ```bash
   node server.js
   ```
5. Open your browser at [http://localhost:3000](http://localhost:3000)

---

## How It Works

### Neural State → Mood Detection

The three sliders map to affective neuroscience dimensions:

| Slider | Axis | Description |
|---|---|---|
| Arousal | Calm ↔ Activated | Nervous system activation level |
| Valence | Negative ↔ Positive | Emotional tone |
| Attention | Diffuse ↔ Focused | Cognitive focus vs mind-wandering |

These map to 8 moods, each triggering a different story genre:

| Mood | Condition | Genre |
|---|---|---|
| Anxious | High arousal, negative valence, diffuse attention | Psychological Thriller |
| Wired | Very high arousal, negative valence | Action Thriller |
| Euphoric | High arousal, positive valence | Adventure |
| Flow State | Moderate arousal, positive valence, high attention | Epic Journey |
| Hyper-focused | High attention, moderate arousal | Sci-Fi Mystery |
| Burnt Out | Low arousal, negative valence | Melancholy Drama |
| Dreamy | Low arousal, neutral valence, diffuse attention | Surreal Fantasy |
| Balanced | All other states | Neutral Drama |

### Audio Pipeline

```
Mood detected
     │
     ├── Script generated (ElevenLabs Agent or pre-written fallback)
     │
     ├── For each segment (parallel):
     │     ├── TTS via ElevenLabs → speech blob
     │     └── SFX via ElevenLabs → sfx blob (narrator segments only)
     │
     ├── Background music generated (ElevenLabs Sound Effects, 30s)
     │
     └── All blobs decoded + mixed in OfflineAudioContext
           ├── SFX plays before each narrator segment
           ├── Music mixed under host intro only (fade in/out)
           └── Exported as WAV → played in browser
```

### Proxy Server

The browser cannot call `api.elevenlabs.io` directly due to CORS restrictions. `server.js` acts as a lightweight local proxy:

- `POST /api/generate-script` — calls the ElevenLabs agent server-side and returns clean JSON
- `/api/elevenlabs/*` → `https://api.elevenlabs.io/*` — forwards all other ElevenLabs API calls

---

## Voices

Default voice configuration:

| Role | Voice |
|---|---|
| Host | Jon — Male |
| Narrator | Bella — Female |

Additional options available in the UI: Hale, Sam, etc. Voice IDs can be replaced in `neurocast.html`.

---

## NeuroHack

Built for UIUC's Spring 2026 NeuroHacks hackathon. The project explores the **Story-Telling Experiences** track — using neurotechnology signals to generate and deliver a personalised narrative experience that adapts in real time to the listener's mental state.

---

## License

MIT
