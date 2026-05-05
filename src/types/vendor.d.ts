declare module '@met4citizen/talkinghead' {
  export class TalkingHead {
    constructor(node: HTMLElement, options?: Record<string, unknown>);
    showAvatar(
      avatar: Record<string, unknown>,
      onprogress?: (event: ProgressEvent) => void
    ): Promise<void>;
    setView(view: string, options?: Record<string, unknown>): void;
    setLighting(options: Record<string, unknown>): void;
    speakAudio(
      data: Record<string, unknown>,
      options?: Record<string, unknown>,
      onsubtitles?: (word: string) => void
    ): void;
    stopSpeaking?(): void;
    stop?(): void;
    start?(): void;
  }
}

declare module '@met4citizen/headtts' {
  export class HeadTTS {
    constructor(options?: Record<string, unknown>);
    connect(
      settings?: Record<string, unknown> | null,
      onprogress?: (event: ProgressEvent) => void,
      onerror?: (event: Event) => void
    ): Promise<void>;
    setup(data: Record<string, unknown>, onerror?: (event: Event) => void): Promise<void>;
    synthesize(
      data: Record<string, unknown>,
      onmessage?: (message: HeadTtsMessage) => void,
      onerror?: (event: Event) => void
    ): Promise<HeadTtsMessage[]>;
    clear(): void;
  }

  export type HeadTtsMessage = {
    type: 'audio' | 'error' | 'custom';
    data: Record<string, unknown>;
  };
}

