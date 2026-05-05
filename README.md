# TalkingHead + HeadTTS Demo

Small browser demo for a video about TalkingHead.

## Run

```bash
npm install --ignore-scripts
npm run tts:download-voices
```

Terminal 1:

```bash
npm run dev:tts
```

Terminal 2:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

## Build

```bash
npm run build
```

## Notes

- The first version uses `@met4citizen/talkinghead` and `@met4citizen/headtts`.
- The frontend tries local HeadTTS first at `http://127.0.0.1:8882/v1`.
- If the local HeadTTS server is unavailable, it falls back to browser WebGPU/WASM mode.
- HeadTTS is English-only in this setup.
- First backend startup can take time because HeadTTS downloads/initializes Kokoro and voice files.
- Voice files are stored in `.headtts/voices/` and are not committed.
- HeadTTS uses WebGPU first and falls back to WASM.
- On Windows, install with `--ignore-scripts`; `@met4citizen/headtts@1.3.0` currently has a Unix-style postinstall command.
- The Russian TTS/lip-sync phase is planned in `.claude/features/001-talkinghead-demo.md`.
