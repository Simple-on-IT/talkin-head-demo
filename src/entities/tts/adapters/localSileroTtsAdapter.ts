import { createRussianVisemeTimeline } from '../../lipsync/russianVisemes';
import type { SynthesizeOptions, TtsAdapter, TtsAudio, TtsVoice } from '../types';

const defaultSileroEndpoint = 'http://127.0.0.1:8892/v1';
const sileroEndpoint = import.meta.env.VITE_TTS_ENDPOINT ?? defaultSileroEndpoint;
const analysisFrameMs = 10;
const speechStartPaddingMs = 45;
const speechEndPaddingMs = 90;
const minimumSpeechWindowShare = 0.55;

type VoicesResponse = {
  voices?: TtsVoice[];
};

type SpeechWindow = {
  durationMs: number;
  startMs: number;
};

export class LocalSileroTtsAdapter implements TtsAdapter {
  voices: TtsVoice[] = [
    { id: 'baya', label: 'Baya' },
    { id: 'kseniya', label: 'Kseniya' },
    { id: 'xenia', label: 'Xenia' },
    { id: 'aidar', label: 'Aidar' },
    { id: 'eugene', label: 'Eugene' }
  ];

  private connected = false;
  private audioContext: AudioContext | null = null;
  private abortController: AbortController | null = null;

  async initialize(onProgress?: (message: string) => void): Promise<void> {
    if (this.connected) {
      return;
    }

    onProgress?.('Подключаем Silero TTS...');
    const response = await fetch(`${sileroEndpoint}/voices`);

    if (!response.ok) {
      throw new Error('Silero TTS недоступен. Запустите npm run dev:ru-tts');
    }

    const data = (await response.json()) as VoicesResponse;
    if (data.voices?.length) {
      this.voices = data.voices;
    }

    this.connected = true;
    onProgress?.('Silero TTS готов');
  }

  async synthesize(text: string, options: SynthesizeOptions): Promise<TtsAudio[]> {
    if (!this.connected) {
      await this.initialize();
    }

    this.abortController = new AbortController();

    const response = await fetch(`${sileroEndpoint}/synthesize`, {
      body: JSON.stringify({
        text,
        voice: options.voice
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      signal: this.abortController.signal
    });

    if (!response.ok) {
      throw new Error(await this.readError(response));
    }

    const audioBuffer = await response.arrayBuffer();
    const audio = await this.decodeAudio(audioBuffer);
    const speechWindow = getSpeechWindow(audio);
    const lipsync = createRussianVisemeTimeline(
      text,
      speechWindow.durationMs,
      speechWindow.startMs
    );

    return [
      {
        audio,
        ...lipsync,
        wdurations: [],
        words: [],
        wtimes: []
      }
    ];
  }

  stop(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  private async decodeAudio(data: ArrayBuffer): Promise<AudioBuffer> {
    const context = this.getAudioContext();
    return context.decodeAudioData(data.slice(0));
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    return this.audioContext;
  }

  private async readError(response: Response): Promise<string> {
    try {
      const data = (await response.json()) as { error?: string };
      return data.error ?? 'Silero TTS synthesis failed';
    } catch {
      return 'Silero TTS synthesis failed';
    }
  }
}

function getSpeechWindow(audio: AudioBuffer): SpeechWindow {
  const durationMs = audio.duration * 1000;
  const channel = audio.getChannelData(0);

  if (!channel.length || durationMs <= 0) {
    return {
      durationMs,
      startMs: 0
    };
  }

  const frameSize = Math.max(1, Math.round((audio.sampleRate * analysisFrameMs) / 1000));
  const rmsFrames = createRmsFrames(channel, frameSize);
  const peakRms = Math.max(...rmsFrames);

  if (peakRms <= 0) {
    return {
      durationMs,
      startMs: 0
    };
  }

  const threshold = Math.max(0.008, peakRms * 0.12);
  const firstSpeechFrame = rmsFrames.findIndex((rms) => rms >= threshold);
  const lastSpeechFrame = findLastSpeechFrame(rmsFrames, threshold);

  if (firstSpeechFrame < 0 || lastSpeechFrame < firstSpeechFrame) {
    return {
      durationMs,
      startMs: 0
    };
  }

  const rawStartMs = (firstSpeechFrame * frameSize * 1000) / audio.sampleRate;
  const rawEndMs = (((lastSpeechFrame + 1) * frameSize * 1000) / audio.sampleRate);
  const startMs = Math.max(0, rawStartMs - speechStartPaddingMs);
  const endMs = Math.min(durationMs, rawEndMs + speechEndPaddingMs);
  const detectedDurationMs = Math.max(0, endMs - startMs);
  const minimumDurationMs = durationMs * minimumSpeechWindowShare;

  return {
    durationMs: Math.min(Math.max(detectedDurationMs, minimumDurationMs), durationMs - startMs),
    startMs
  };
}

function createRmsFrames(samples: Float32Array, frameSize: number): number[] {
  const frameCount = Math.ceil(samples.length / frameSize);
  const frames: number[] = [];

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
    const start = frameIndex * frameSize;
    const end = Math.min(samples.length, start + frameSize);
    let sumSquares = 0;

    for (let sampleIndex = start; sampleIndex < end; sampleIndex++) {
      sumSquares += samples[sampleIndex] * samples[sampleIndex];
    }

    frames.push(Math.sqrt(sumSquares / Math.max(1, end - start)));
  }

  return frames;
}

function findLastSpeechFrame(frames: number[], threshold: number): number {
  for (let index = frames.length - 1; index >= 0; index--) {
    if (frames[index] >= threshold) {
      return index;
    }
  }

  return -1;
}
