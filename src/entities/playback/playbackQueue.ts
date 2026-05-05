import { stopTalkingHead } from '../avatar/talkingHeadClient';
import type { PlaybackAudioQueue, PlaybackTarget } from './types';

export function stopPlayback(target: PlaybackTarget): void {
  stopTalkingHead(target);
}

export function playAudioQueue(target: PlaybackTarget, audioQueue: PlaybackAudioQueue): void {
  if (!target) {
    throw new Error('Avatar is still loading');
  }

  audioQueue.forEach((audio) => {
    target.speakAudio(audio, {}, () => undefined);
  });
}
