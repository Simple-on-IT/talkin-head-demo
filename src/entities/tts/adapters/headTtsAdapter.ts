import { BrowserHeadTtsAdapter } from './browserHeadTtsAdapter';
import { LocalHeadTtsAdapter } from './localHeadTtsAdapter';
import { HEAD_TTS_VOICES } from '../voices';
import type { SynthesizeOptions, TtsAdapter, TtsAudio, TtsVoice } from '../types';

export class HeadTtsAdapter implements TtsAdapter {
  readonly voices: TtsVoice[] = HEAD_TTS_VOICES;

  private readonly localAdapter = new LocalHeadTtsAdapter();
  private readonly browserAdapter = new BrowserHeadTtsAdapter();
  private activeAdapter: TtsAdapter | null = null;

  async initialize(onProgress?: (message: string) => void): Promise<void> {
    if (this.activeAdapter) {
      return;
    }

    try {
      await this.localAdapter.initialize(onProgress);
      this.activeAdapter = this.localAdapter;
    } catch {
      onProgress?.('Local HeadTTS unavailable, using browser mode...');
      await this.browserAdapter.initialize(onProgress);
      this.activeAdapter = this.browserAdapter;
    }
  }

  async synthesize(text: string, options: SynthesizeOptions): Promise<TtsAudio[]> {
    if (!this.activeAdapter) {
      await this.initialize();
    }

    return this.requireActiveAdapter().synthesize(text, options);
  }

  stop(): void {
    this.localAdapter.stop();
    this.browserAdapter.stop();
  }

  private requireActiveAdapter(): TtsAdapter {
    if (!this.activeAdapter) {
      throw new Error('HeadTTS is not initialized');
    }

    return this.activeAdapter;
  }
}
