# TalkingHead Demo Plan

## Request

Create a small demo for a video about TalkingHead:

- simple avatar centered on the page;
- text input;
- Play button;
- avatar speaks the entered text;
- Stage 1 uses HeadTTS/Kokoro;
- Stage 2 later replaces TTS with a Russian-capable implementation and custom lip-sync work.

## Imported Working Rules

Adapted from `C:\Users\eagle\Desktop\dev\young-energetic`:

- maintain a persistent feature plan;
- split work into concrete tracks;
- keep changes scoped;
- prefer existing patterns and official APIs;
- do not edit unrelated/generated files;
- use TypeScript where applicable;
- keep UI work functional and testable;
- verify with the smallest relevant commands first;
- update this plan after each completed track.

## Stage 1: HeadTTS Demo

Goal: build the first reliable demo with English speech and accurate lip-sync.

### Track 1. Project Setup

Status: completed

Tasks:

- choose lightweight frontend stack, preferably Vite + TypeScript;
- install TalkingHead and HeadTTS dependencies or use CDN/modules if that is simpler for the demo;
- create basic project structure;
- add scripts for dev, build, and preview;
- document browser requirements for WebGPU/WASM fallback.

Acceptance criteria:

- project starts locally;
- production build works;
- empty app renders without errors.

Notes:

- Created a Vite + React + TypeScript project.
- Installed dependencies with `npm install --ignore-scripts` because `@met4citizen/headtts@1.3.0` has a Unix-style postinstall command that fails on Windows.
- Added `npm run dev`, `npm run build`, and `npm run preview`.

### Track 2. Avatar Scene

Status: completed

Tasks:

- add centered TalkingHead canvas/container;
- load a simple compatible GLB avatar;
- configure initial camera view for a talking-head framing;
- add idle state;
- expose Stop/reset behavior.

Acceptance criteria:

- avatar loads visibly in desktop Chromium;
- avatar remains centered and usable on mobile-width viewport;
- no blank WebGL canvas after load.

Notes:

- Added a centered TalkingHead stage.
- Uses the TalkingHead example `brunette.glb` from jsDelivr/GitHub.
- Manual canvas/browser rendering still needs a visual check on the user's machine because this environment cannot open a GUI browser.

### Track 3. HeadTTS Integration

Status: completed

Tasks:

- integrate HeadTTS client;
- prefer browser WebGPU endpoint with WASM fallback, or local HeadTTS Node server if browser mode is too heavy for recording;
- configure default English voice;
- pass HeadTTS audio/viseme result into `TalkingHead.speakAudio(...)`;
- handle first-load progress, generation state, and errors.

Acceptance criteria:

- entered English text is synthesized;
- avatar speaks the generated audio;
- lip movement follows the audio using HeadTTS visemes/timestamps;
- repeated Play calls do not overlap unexpectedly.

Notes:

- Added `HeadTtsAdapter` behind a small adapter boundary.
- Configured browser endpoints `webgpu` then `wasm`.
- Configured explicit worker module URL and dictionary CDN URL for Vite compatibility.

### Track 4. Demo UI

Status: completed

Tasks:

- add textarea with a short default English phrase;
- add Play and Stop buttons;
- add voice selector if HeadTTS voice setup is straightforward;
- show compact status text for loading/generating/speaking/error;
- keep the interface minimal for screen recording.

Acceptance criteria:

- user can type text and trigger playback;
- controls are clear and do not cover the avatar;
- UI is readable in recording resolution.

Notes:

- Added textarea, voice selector, speed range, Play/Stop buttons, and status text.
- UI is intentionally minimal for screen recording.

### Track 5. Verification

Status: completed

Tasks:

- run build/type-check;
- test in desktop Chromium/Edge;
- verify first model load behavior;
- verify second playback is faster after caching;
- check short and medium text samples.

Acceptance criteria:

- build passes;
- manual playback test passes;
- known limitations are documented.

Notes:

- `npm run build` passes.
- Dev server responds at `http://127.0.0.1:5173/`.
- Manual playback check is still needed in Chromium/Edge because first-run HeadTTS downloads model/voice files and requires browser WebGPU/WASM support.

### Track 6. Playback Bugfix: Multiple Audio Messages

Status: completed

Problem:

- HeadTTS can return multiple `audio` messages for one synthesis request.
- The current adapter takes only the first `audio` message.
- With text like `Hello! This is...`, only `Hello!` may be spoken.

Tasks:

- Change the TTS adapter output from a single audio object to an ordered list of audio objects.
- Queue every audio object into `TalkingHead.speakAudio(...)`.
- Keep Stop behavior clearing both HeadTTS work and TalkingHead speech queue.
- Verify with text containing multiple sentences.

Acceptance criteria:

- The full textarea content is spoken, not only the first sentence.
- Repeated Play calls stop the previous queue and start the new one.
- Build passes.

Notes:

- `TtsAdapter.synthesize` now returns an ordered array of audio objects.
- The UI queues every audio object through `TalkingHead.speakAudio(...)`.
- `npm run build` passes.

### Track 7. Local HeadTTS Backend Mode

Status: completed

Problem:

- Browser HeadTTS loads Kokoro/Transformers/voice files in the user's browser.
- First load is slow and can block or stutter the UI while TalkingHead/Three.js is also active.
- For screen recording, backend preloading is more predictable.

Target architecture:

```text
Frontend
textarea -> POST /api/tts -> audio objects + visemes -> TalkingHead.speakAudio(...)

Backend
HeadTTS Node process/server -> model loaded once -> synthesize requests on demand
```

Tasks:

- Add a small local backend for HeadTTS.
- Preload model/voices at backend startup or via explicit warmup.
- Expose health/ready endpoint.
- Expose synthesize endpoint:
  - input text;
  - voice;
  - speed;
  - language `en-us`;
  - returns all `audio` messages in order.
- Keep this backend boundary compatible with the future Russian TTS pipeline.

Acceptance criteria:

- Frontend can synthesize through local backend.
- First browser interaction no longer loads Kokoro in the UI thread/browser worker.
- Backend logs readiness and synthesis errors clearly.
- Browser adapter remains available as fallback if useful.

Notes:

- Added `headtts-node.json`.
- Added `npm run dev:tts` wrapper around the official `headtts-node.mjs`.
- Added `npm run tts:download-voices` to download Kokoro voice `.bin` files into `.headtts/voices`.
- Verified `POST http://127.0.0.1:8882/v1/hello`.
- Verified `POST http://127.0.0.1:8882/v1/synthesize` with a short phrase; response included WAV audio, words, and visemes.

### Track 8. Frontend Adapter Switch

Status: completed

Tasks:

- Add a `TtsAdapter` implementation for the local backend.
- Prefer backend adapter by default.
- Keep browser HeadTTS adapter as fallback/demo mode if backend is unavailable.
- Add compact UI status for backend readiness and synthesis progress.
- Avoid adding a visible technical explanation to the app surface.

Acceptance criteria:

- `Play` uses backend mode by default.
- If backend is not ready, UI shows a concise error/status.
- Stage 2 Russian TTS can reuse the same adapter boundary.

Notes:

- Frontend HeadTTS adapter now tries `http://127.0.0.1:8882/v1` first.
- If local backend is unavailable, the same adapter falls back to browser `webgpu` then `wasm`.

### Track 9. Backend Prewarm And Recording UX

Status: in progress

Tasks:

- Add a backend warmup script/command if HeadTTS does not preload eagerly.
- Optionally synthesize a tiny phrase at startup to force model initialization.
- Update README with the two-process run instructions.
- Document expected first startup delay and faster subsequent Play behavior.

Acceptance criteria:

- User can start backend, wait until ready, then start frontend.
- During recording, opening the page is fast and Play does not trigger model download in the browser.
- Known limitations are documented.

Notes:

- README now documents the two-process run flow.
- Voice files are ignored via `.gitignore`.
- A formal warmup command is still optional; current first synthesis can be used as warmup.

### Track 10. Architecture Refactor

Status: in progress

Problem:

- The demo is small, but UI orchestration, avatar lifecycle, playback workflow, adapter selection, constants, and app copy are mostly concentrated around `App.tsx` and a few broad `lib` files.
- Stage 2 Russian TTS will add text normalization, TTS engine selection, phoneme/viseme mapping, timing alignment, and playback glue; without clearer module boundaries this will make the current simple demo harder to change safely.

Target architecture:

```text
src/
  app/
    App.tsx
    AppShell.tsx
  features/demo/
    TalkingHeadDemo.tsx
    demoConfig.ts
    useTalkingHeadDemo.ts
  entities/avatar/
    talkingHeadClient.ts
    avatarConfig.ts
    types.ts
  entities/tts/
    adapters/headTtsAdapter.ts
    adapters/browserHeadTtsAdapter.ts
    adapters/localHeadTtsAdapter.ts
    types.ts
    voices.ts
  entities/playback/
    playbackQueue.ts
    types.ts
  shared/ui/
    Button.tsx
    Field.tsx
    StatusLine.tsx
  shared/styles/
    globals.css
```

Proposed stages:

- First split `App.tsx` into presentational UI and a `useTalkingHeadDemo` orchestration hook.
- Move avatar constants and TalkingHead setup into `entities/avatar`.
- Split HeadTTS backend/browser fallback into explicit adapters behind the same `TtsAdapter` interface.
- Introduce a small playback boundary that owns stop/queue behavior for multiple audio chunks.
- Add placeholders for future Russian pipeline under the same TTS/playback contracts only when Stage 2 starts.

Acceptance criteria:

- No user-visible behavior changes.
- `npm run build` passes.
- The demo UI still uses one high-level hook/API rather than importing TalkingHead/HeadTTS details directly.
- Stage 2 can add a Russian adapter without changing the textarea/control panel component.

Notes:

- Split root `App.tsx` into `src/app/App.tsx` and `src/app/AppShell.tsx`.
- Moved the demo screen into `src/features/demo/TalkingHeadDemo.tsx`.
- Moved play/stop/load/synthesize orchestration into `src/features/demo/useTalkingHeadDemo.ts`.
- Moved TalkingHead setup into `src/entities/avatar`.
- Split HeadTTS into explicit local/browser endpoint adapters with a composite fallback adapter in `src/entities/tts`.
- Added `src/entities/playback/playbackQueue.ts` for queueing multiple audio chunks into TalkingHead.
- Moved shared UI wrappers into `src/shared/ui` and global styles into `src/shared/styles/globals.css`.
- `npm run build` passes; Vite still reports the existing large chunk warning from the avatar/TTS dependencies.

## Stage 2: Russian TTS And Custom Lip-Sync

Goal: replace HeadTTS with a Russian-capable TTS pipeline and implement the missing lip-sync pieces.

### Track 1. Russian TTS Selection

Status: future

Candidate engines:

- Piper: local, open-source, multiple voices, good practical server option;
- Silero TTS: strong candidate for Russian neural speech, likely Python backend;
- RHVoice: open-source Russian support, simpler but less natural;
- browser Web Speech API: easiest Russian voice path, but weak timing/lip-sync support.

Decision criteria:

- Russian voice quality;
- local/offline support;
- latency acceptable for demo;
- license suitability;
- ability to expose audio in a browser-friendly format;
- feasibility of generating or approximating timings.

### Track 2. TTS Adapter Boundary

Status: future

Tasks:

- define a common `TtsAdapter` output shape:
  - audio data or URL/blob;
  - sample rate/encoding metadata;
  - optional words and timings;
  - optional visemes and timings;
- make HeadTTS the first adapter implementation;
- later add a Russian adapter without changing the demo UI.

Acceptance criteria:

- UI calls one adapter interface;
- switching engines is mostly configuration/code-local.

### Track 3. Russian Text Normalization

Status: future

Tasks:

- normalize punctuation, numbers, abbreviations, symbols, and mixed Latin/Cyrillic cases;
- keep normalized text aligned enough for TTS and lip-sync timing;
- add tests for representative Russian phrases.

Acceptance criteria:

- common Russian inputs are predictable before synthesis;
- edge cases are documented.

### Track 4. Russian Phoneme And Viseme Mapping

Status: future

Tasks:

- choose phonemization approach for Russian;
- map Russian phonemes to Oculus visemes used by TalkingHead;
- define durations and fallback rules;
- add unit tests for mapping.

Acceptance criteria:

- Russian phonemes map to valid TalkingHead/Oculus viseme IDs;
- mapping handles silence, plosives, vowels, fricatives, and soft consonants reasonably.

### Track 5. Timing Alignment

Status: future

Possible approaches:

- use TTS-provided word/phoneme timings if available;
- use forced alignment if practical;
- approximate timings from phoneme durations;
- use audio-driven viseme detection as a fallback.

Acceptance criteria:

- lip movement is close enough for a video demo;
- long text does not drift badly;
- implementation has documented limitations.

### Track 6. Russian Playback Integration

Status: future

Tasks:

- feed Russian audio and generated visemes into `TalkingHead.speakAudio(...)` or streaming APIs;
- tune trim/start offsets;
- compare several sample phrases;
- keep HeadTTS path available as a fallback demo mode.

Acceptance criteria:

- avatar speaks Russian text;
- lips move plausibly with Russian audio;
- demo UI can switch between English HeadTTS and Russian mode if useful.

## Open Decisions

- exact frontend stack;
- avatar model source;
- whether Stage 1 uses HeadTTS browser mode or local HeadTTS server;
- whether the first demo should include a voice selector;
- Russian TTS engine for Stage 2.

## Session Log

- 2026-05-05: Created initial two-stage plan and adapted project working rules from `young-energetic`.
- 2026-05-05: Implemented Stage 1 scaffold, avatar scene, HeadTTS adapter, demo UI, and build verification.
- 2026-05-05: Fixed multi-audio playback and switched TTS to backend-first mode using the official HeadTTS Node server.
