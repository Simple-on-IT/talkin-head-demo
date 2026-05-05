import { HeadTTS, type HeadTtsMessage } from '@met4citizen/headtts';
import { HEAD_TTS_VOICES } from '../voices';
import type { SynthesizeOptions, TtsAdapter, TtsAudio, TtsVoice } from '../types';

const workerModule = new URL(
  '@met4citizen/headtts/modules/worker-tts.mjs',
  import.meta.url
).href;

const dictionaryURL = 'https://cdn.jsdelivr.net/npm/@met4citizen/headtts@1.3/dictionaries/';

export class HeadTtsEndpointAdapter implements TtsAdapter {
  readonly voices: TtsVoice[] = HEAD_TTS_VOICES;

  private client: HeadTTS | null = null;
  private connected = false;
  private currentVoice = '';
  private currentSpeed = 1;

  constructor(
    private readonly endpoints: string[],
    private readonly loadingMessage: string
  ) {}

  async initialize(onProgress?: (message: string) => void): Promise<void> {
    if (this.connected) {
      return;
    }

    onProgress?.(this.loadingMessage);
    this.client = new HeadTTS({
      endpoints: this.endpoints,
      languages: ['en-us'],
      voices: this.voices.map((voice) => voice.id),
      dictionaryURL,
      workerModule
    });

    await this.client.connect(null, (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress?.(`Loading HeadTTS model: ${percent}%`);
      }
    });

    this.connected = true;
    onProgress?.('HeadTTS is ready');
  }

  async synthesize(text: string, options: SynthesizeOptions): Promise<TtsAudio[]> {
    if (!this.client || !this.connected) {
      await this.initialize();
    }

    const client = this.requireClient();

    if (this.currentVoice !== options.voice || this.currentSpeed !== options.speed) {
      await client.setup({
        voice: options.voice,
        language: 'en-us',
        speed: options.speed,
        audioEncoding: 'wav'
      });

      this.currentVoice = options.voice;
      this.currentSpeed = options.speed;
    }

    const messages = await client.synthesize({ input: text });
    const audioMessages = messages.filter(this.isAudioMessage);
    const errorMessage = messages.find(this.isErrorMessage);

    if (errorMessage) {
      throw new Error(String(errorMessage.data.error ?? 'HeadTTS synthesis failed'));
    }

    if (audioMessages.length === 0) {
      throw new Error('HeadTTS did not return audio data');
    }

    return audioMessages.map((message) => message.data);
  }

  stop(): void {
    this.client?.clear();
  }

  private requireClient(): HeadTTS {
    if (!this.client) {
      throw new Error('HeadTTS is not initialized');
    }

    return this.client;
  }

  private isAudioMessage(message: HeadTtsMessage): boolean {
    return message.type === 'audio';
  }

  private isErrorMessage(message: HeadTtsMessage): boolean {
    return message.type === 'error';
  }
}
