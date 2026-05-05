import { useCallback, useMemo, useRef, useState } from 'react';
import {
  createTalkingHead,
  stopTalkingHead
} from '../../entities/avatar/talkingHeadClient';
import type { TalkingHeadInstance } from '../../entities/avatar/types';
import { playAudioQueue, stopPlayback } from '../../entities/playback/playbackQueue';
import { HeadTtsAdapter } from '../../entities/tts/adapters/headTtsAdapter';
import type { TtsVoice } from '../../entities/tts/types';
import { DEFAULT_DEMO_TEXT } from './demoConfig';

export type DemoStatus =
  | 'idle'
  | 'loading-avatar'
  | 'loading-tts'
  | 'synthesizing'
  | 'speaking'
  | 'error';

type TalkingHeadDemoState = {
  isBusy: boolean;
  speed: number;
  status: DemoStatus;
  statusText: string;
  text: string;
  voice: string;
  voices: TtsVoice[];
};

type TalkingHeadDemoActions = {
  handleAvatarMount(node: HTMLDivElement | null): void;
  handlePlayClick(): Promise<void>;
  handleSpeedChange(event: React.ChangeEvent<HTMLInputElement>): void;
  handleStopClick(): void;
  handleTextChange(event: React.ChangeEvent<HTMLTextAreaElement>): void;
  handleVoiceChange(event: React.ChangeEvent<HTMLSelectElement>): void;
};

export type TalkingHeadDemoModel = TalkingHeadDemoState & TalkingHeadDemoActions;

export function useTalkingHeadDemo(): TalkingHeadDemoModel {
  const avatarRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<TalkingHeadInstance | null>(null);
  const isInitializingAvatarRef = useRef(false);
  const tts = useMemo(() => new HeadTtsAdapter(), []);

  const [text, setText] = useState(DEFAULT_DEMO_TEXT);
  const [voice, setVoice] = useState(tts.voices[0]?.id ?? 'af_bella');
  const [speed, setSpeed] = useState(1);
  const [status, setStatus] = useState<DemoStatus>('idle');
  const [statusText, setStatusText] = useState('Ready');

  const handleAvatarMount = useCallback((node: HTMLDivElement | null) => {
    avatarRef.current = node;

    if (!node || headRef.current || isInitializingAvatarRef.current) {
      return;
    }

    isInitializingAvatarRef.current = true;
    setStatus('loading-avatar');
    setStatusText('Loading avatar...');

    createTalkingHead(node)
      .then((head) => {
        headRef.current = head;
        setStatus('idle');
        setStatusText('Avatar is ready');
      })
      .catch((error: unknown) => {
        setStatus('error');
        setStatusText(error instanceof Error ? error.message : 'Avatar failed to load');
      })
      .finally(() => {
        isInitializingAvatarRef.current = false;
      });
  }, []);

  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  }, []);

  const handleVoiceChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setVoice(event.target.value);
  }, []);

  const handleSpeedChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSpeed(Number(event.target.value));
  }, []);

  const handlePlayClick = useCallback(async () => {
    const normalizedText = text.trim();

    if (!normalizedText) {
      setStatus('error');
      setStatusText('Enter English text first');
      return;
    }

    if (!headRef.current) {
      setStatus('error');
      setStatusText('Avatar is still loading');
      return;
    }

    try {
      stopPlayback(headRef.current);
      tts.stop();

      setStatus('loading-tts');
      setStatusText('Preparing HeadTTS...');
      await tts.initialize(setStatusText);

      setStatus('synthesizing');
      setStatusText('Synthesizing speech...');
      const audioQueue = await tts.synthesize(normalizedText, { voice, speed });

      setStatus('speaking');
      setStatusText('Speaking...');
      playAudioQueue(headRef.current, audioQueue);
    } catch (error) {
      setStatus('error');
      setStatusText(error instanceof Error ? error.message : 'Speech synthesis failed');
    }
  }, [speed, text, tts, voice]);

  const handleStopClick = useCallback(() => {
    tts.stop();
    stopTalkingHead(headRef.current);
    setStatus('idle');
    setStatusText('Stopped');
  }, [tts]);

  const isBusy =
    status === 'loading-avatar' || status === 'loading-tts' || status === 'synthesizing';

  return {
    handleAvatarMount,
    handlePlayClick,
    handleSpeedChange,
    handleStopClick,
    handleTextChange,
    handleVoiceChange,
    isBusy,
    speed,
    status,
    statusText,
    text,
    voice,
    voices: tts.voices
  };
}
