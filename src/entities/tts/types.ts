export type TtsVoice = {
  id: string;
  label: string;
};

export type TtsAudio = Record<string, unknown>;

export type SynthesizeOptions = {
  voice: string;
  speed: number;
};

export type TtsAdapter = {
  readonly voices: TtsVoice[];
  initialize(onProgress?: (message: string) => void): Promise<void>;
  synthesize(text: string, options: SynthesizeOptions): Promise<TtsAudio[]>;
  stop(): void;
};
