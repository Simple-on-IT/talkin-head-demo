declare module '@met4citizen/talkinghead' {
  export class TalkingHead {
    constructor(node: HTMLElement, options?: Record<string, unknown>);
    showAvatar(
      avatar: Record<string, unknown>,
      onprogress?: (event: ProgressEvent) => void
    ): Promise<void>;
    setView(view: string, options?: Record<string, unknown>): void;
    setLighting(options: Record<string, unknown>): void;
    setValue(target: string, value: number, durationMs?: number | null): void;
    lookAtCamera(t: number): void;
    makeEyeContact(t: number): void;
    speakAudio(
      data: Record<string, unknown>,
      options?: Record<string, unknown>,
      onsubtitles?: (word: string) => void
    ): void;
    speakText(
      text: string,
      options?: Record<string, unknown>,
      onsubtitles?: (word: string) => void,
      excludes?: number[][]
    ): void;
    stopSpeaking?(): void;
    stop?(): void;
    start?(): void;
  }
}

declare module '@met4citizen/talkinghead/modules/lipsync-en.mjs' {
  export class LipsyncEn {
    preProcessText(text: string): string;
    wordsToVisemes(word: string): {
      durations: number[];
      times: number[];
      visemes: string[];
    };
  }
}

