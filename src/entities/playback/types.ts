import type { TalkingHeadInstance } from '../avatar/types';
import type { TtsAudio } from '../tts/types';

export type PlaybackTarget = TalkingHeadInstance | null;

export type PlaybackAudioQueue = TtsAudio[];
