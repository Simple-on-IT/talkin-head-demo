# AGENTS.md

Guidance for Codex and other coding agents working in this repository.

## Project Goal

Build a small TalkingHead demo for a video:

- a centered 3D avatar;
- a text input area;
- Play/Stop controls;
- first TTS implementation via HeadTTS/Kokoro;
- later replacement with Russian TTS plus custom lip-sync work.

## Workflow

- Keep a persistent feature plan in `.claude/features/`.
- Treat the plan file as the source of truth for status, notes, tracks, files, and verification.
- Before implementation, update the plan and wait for explicit approval when the current request is only planning.
- Keep changes scoped to the current approved stage.
- Prefer existing library APIs and documented examples over custom infrastructure.
- Do not rewrite unrelated files or generated artifacts.
- Before finishing a code change, run the smallest relevant build/lint/test command available and report anything not run.

## Frontend Rules

- Use functional React components if the demo is implemented with React.
- Use full TypeScript when a build setup is present.
- Avoid `any`.
- Extract JSX event handlers into named `handleXxx` functions.
- Do not pass inline arrow functions directly to JSX props.
- Do not call `setState` synchronously inside `useEffect` or `useLayoutEffect`.
- Use `lucide-react` for icons if an icon library is needed.
- Keep the first screen as the actual usable demo, not a landing page.
- Verify the rendered UI in browser when feasible, especially the avatar canvas and mobile layout.

## TalkingHead Notes

- Use the official TalkingHead project and examples as the primary reference.
- Use HeadTTS for the first implementation because it provides audio, phoneme-level timestamps, and Oculus visemes compatible with TalkingHead.
- Keep TTS integration behind a small adapter boundary so HeadTTS can later be replaced by a Russian TTS pipeline.
- For the Russian phase, separate responsibilities:
  - text normalization;
  - TTS audio generation;
  - phoneme/viseme extraction or mapping;
  - timing alignment;
  - TalkingHead playback adapter.

## Testing Policy

- For narrow UI changes, run build/type-check first.
- For playback behavior, manually verify in a Chromium browser when automated tests cannot validate WebGPU/audio reliably.
- For future adapter logic, add focused tests for text normalization and viseme mapping.
- Run broader browser checks when changes affect layout, controls, or playback flow.

