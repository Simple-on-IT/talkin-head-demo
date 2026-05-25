import { stopTalkingHead } from '../avatar/talkingHeadClient';
import type { PlaybackAudioQueue, PlaybackTarget } from './types';

type AudioWithDuration = {
  audio?: {
    duration?: number;
  };
};

const playbackBreakMs = 300;
const playbackCompletionPaddingMs = 120;

export function stopPlayback(target: PlaybackTarget): void {
  stopTalkingHead(target);
}

export function playAudioQueue(
  target: PlaybackTarget,
  audioQueue: PlaybackAudioQueue,
  onComplete?: () => void
): void {
  if (!target) {
    throw new Error('Avatar is still loading');
  }

  audioQueue.forEach((audio) => {
    target.speakAudio(audio, {}, () => undefined);
  });

  if (onComplete) {
    globalThis.setTimeout(onComplete, getPlaybackDurationMs(audioQueue));
  }
}

function getPlaybackDurationMs(audioQueue: PlaybackAudioQueue): number {
  const audioDurationMs = audioQueue.reduce((total, item) => {
    const duration = (item as AudioWithDuration).audio?.duration ?? 0;
    return total + duration * 1000;
  }, 0);

  return audioDurationMs + audioQueue.length * playbackBreakMs + playbackCompletionPaddingMs;
}
