import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createTalkingHead,
  stopTalkingHead
} from '../../entities/avatar/talkingHeadClient';
import type { TalkingHeadSceneMode } from '../../entities/avatar/talkingHeadClient';
import { DEFAULT_AVATAR_ID } from '../../entities/avatar/avatarConfig';
import type { TalkingHeadInstance } from '../../entities/avatar/types';
import { playAudioQueue, stopPlayback } from '../../entities/playback/playbackQueue';
import { LocalSileroTtsAdapter } from '../../entities/tts/adapters/localSileroTtsAdapter';
import type { TtsAudio, TtsVoice } from '../../entities/tts/types';
import { demoCopy } from './demoCopy';
import { DEFAULT_DEMO_TEXT } from './demoConfig';

export type DemoStatus =
  | 'idle'
  | 'loading-avatar'
  | 'loading-tts'
  | 'synthesizing'
  | 'speaking'
  | 'error';

type TalkingHeadDemoState = {
  isCinematicMode: boolean;
  isAdvancedOpen: boolean;
  isBusy: boolean;
  isSpeaking: boolean;
  status: DemoStatus;
  statusText: string;
  text: string;
  voice: string;
  voices: TtsVoice[];
};

type TalkingHeadDemoActions = {
  handleAvatarMount(node: HTMLDivElement | null): void;
  handleAdvancedToggle(): void;
  handleBackClick(): void;
  handleCinematicModeClick(): void;
  handlePlayClick(): Promise<void>;
  handlePrimaryActionClick(): void;
  handleStopClick(): void;
  handleTextChange(event: React.ChangeEvent<HTMLTextAreaElement>): void;
  handleVoiceChange(event: React.ChangeEvent<HTMLSelectElement>): void;
};

export type TalkingHeadDemoModel = TalkingHeadDemoState & TalkingHeadDemoActions;

type SpeechCache = {
  audioQueue: TtsAudio[];
  key: string;
};

type PersistedDemoSettings = {
  text?: unknown;
  voice?: unknown;
};

const defaultVoiceId = 'kseniya';
const cinematicModeParam = 'cinematic';
const settingsStorageKey = 'talkinghead-demo-settings';

function createSpeechCacheKey(text: string, voice: string): string {
  return `${voice}:${text}`;
}

function getInitialVoice(voices: TtsVoice[]): string {
  const persistedVoice = readDemoSettings().voice;

  if (persistedVoice && voices.some((item) => item.id === persistedVoice)) {
    return persistedVoice;
  }

  return voices.some((item) => item.id === defaultVoiceId) ? defaultVoiceId : voices[0]?.id ?? 'baya';
}

function getInitialText(): string {
  return readDemoSettings().text || DEFAULT_DEMO_TEXT;
}

function getInitialMode(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get('mode') === cinematicModeParam;
}

function getCinematicUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.set('mode', cinematicModeParam);
  return url.toString();
}

function getDefaultUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.delete('mode');
  return url.toString();
}

function readDemoSettings(): { text: string; voice: string } {
  try {
    const rawValue = window.sessionStorage.getItem(settingsStorageKey);

    if (!rawValue) {
      return { text: '', voice: '' };
    }

    const settings = JSON.parse(rawValue) as PersistedDemoSettings;

    return {
      text: typeof settings.text === 'string' ? settings.text : '',
      voice: typeof settings.voice === 'string' ? settings.voice : ''
    };
  } catch {
    return { text: '', voice: '' };
  }
}

function persistDemoSettings(text: string, voice: string): void {
  try {
    window.sessionStorage.setItem(
      settingsStorageKey,
      JSON.stringify({
        text,
        voice
      })
    );
  } catch {
    // Session storage can be unavailable in locked-down browser contexts.
  }
}

export function useTalkingHeadDemo(): TalkingHeadDemoModel {
  const avatarRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<TalkingHeadInstance | null>(null);
  const isInitializingAvatarRef = useRef(false);
  const playbackRunIdRef = useRef(0);
  const prewarmKeyRef = useRef<string | null>(null);
  const speechCacheRef = useRef<SpeechCache | null>(null);
  const tts = useMemo(() => new LocalSileroTtsAdapter(), []);

  const [isCinematicMode] = useState(getInitialMode);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [text, setText] = useState(getInitialText);
  const [voices, setVoices] = useState<TtsVoice[]>(tts.voices);
  const [voice, setVoice] = useState(getInitialVoice(tts.voices));
  const [status, setStatus] = useState<DemoStatus>('idle');
  const [statusText, setStatusText] = useState<string>(demoCopy.status.idle);
  const sceneMode: TalkingHeadSceneMode = isCinematicMode ? 'cinematic' : 'default';

  useEffect(() => {
    const normalizedText = text.trim();
    const cacheKey = createSpeechCacheKey(normalizedText, voice);

    if (
      status !== 'idle' ||
      normalizedText !== DEFAULT_DEMO_TEXT ||
      speechCacheRef.current?.key === cacheKey ||
      prewarmKeyRef.current === cacheKey
    ) {
      return undefined;
    }

    let shouldIgnore = false;
    prewarmKeyRef.current = cacheKey;

    async function prewarmDefaultSpeech(): Promise<void> {
      try {
        await tts.initialize();
        const audioQueue = await tts.synthesize(normalizedText, { voice });

        if (shouldIgnore) {
          return;
        }

        speechCacheRef.current = { audioQueue, key: cacheKey };
        setVoices(tts.voices);
        if (!tts.voices.some((item) => item.id === voice)) {
          setVoice(getInitialVoice(tts.voices));
        }
      } catch {
        if (!shouldIgnore) {
          speechCacheRef.current = null;
        }
      } finally {
        if (prewarmKeyRef.current === cacheKey) {
          prewarmKeyRef.current = null;
        }
      }
    }

    void prewarmDefaultSpeech();

    return () => {
      shouldIgnore = true;
    };
  }, [status, text, tts, voice]);

  useEffect(() => {
    persistDemoSettings(text, voice);
  }, [text, voice]);

  const handleAvatarMount = useCallback((node: HTMLDivElement | null) => {
    avatarRef.current = node;

    if (!node || headRef.current || isInitializingAvatarRef.current) {
      return;
    }

    isInitializingAvatarRef.current = true;
    setStatus('loading-avatar');
    setStatusText(demoCopy.status.loadAvatar);

    createTalkingHead(node, DEFAULT_AVATAR_ID, sceneMode)
      .then((head) => {
        headRef.current = head;
        setStatus('idle');
        setStatusText(demoCopy.status.avatarReady);
      })
      .catch((error: unknown) => {
        setStatus('error');
        setStatusText(error instanceof Error ? error.message : demoCopy.status.loadAvatarFailed);
      })
      .finally(() => {
        isInitializingAvatarRef.current = false;
      });
  }, [sceneMode]);

  const handleAdvancedToggle = useCallback(() => {
    setIsAdvancedOpen((current) => !current);
  }, []);

  const handleBackClick = useCallback(() => {
    persistDemoSettings(text, voice);
    window.location.assign(getDefaultUrl());
  }, [text, voice]);

  const handleCinematicModeClick = useCallback(() => {
    persistDemoSettings(text, voice);
    window.location.assign(getCinematicUrl());
  }, [text, voice]);

  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  }, []);

  const handleVoiceChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setVoice(event.target.value);
  }, []);

  const handlePlayClick = useCallback(async () => {
    const normalizedText = text.trim();

    if (!normalizedText) {
      setStatus('error');
      setStatusText(demoCopy.status.emptyText);
      return;
    }

    if (!headRef.current) {
      setStatus('error');
      setStatusText(demoCopy.status.avatarNotReady);
      return;
    }

    const playbackRunId = playbackRunIdRef.current + 1;
    playbackRunIdRef.current = playbackRunId;
    const cacheKey = createSpeechCacheKey(normalizedText, voice);
    const cachedAudioQueue =
      speechCacheRef.current?.key === cacheKey ? speechCacheRef.current.audioQueue : null;

    try {
      stopPlayback(headRef.current);
      if (!cachedAudioQueue) {
        tts.stop();
      }

      let audioQueue = cachedAudioQueue;
      if (!audioQueue) {
        setStatus('loading-tts');
        setStatusText(demoCopy.status.loadTts);
        await tts.initialize();
        setVoices(tts.voices);
        if (!tts.voices.some((item) => item.id === voice)) {
          setVoice(getInitialVoice(tts.voices));
        }

        setStatus('synthesizing');
        setStatusText(demoCopy.status.synthesize);
        audioQueue = await tts.synthesize(normalizedText, { voice });
        speechCacheRef.current = { audioQueue, key: cacheKey };
      }

      setStatus('speaking');
      setStatusText(demoCopy.status.speak);
      playAudioQueue(headRef.current, audioQueue, () => {
        if (playbackRunIdRef.current !== playbackRunId) {
          return;
        }

        setStatus('idle');
        setStatusText(demoCopy.status.idle);
      });

      if (playbackRunIdRef.current === playbackRunId) {
        setStatusText(demoCopy.status.speak);
      }
    } catch (error) {
      if (playbackRunIdRef.current === playbackRunId) {
        setStatus('error');
        setStatusText(error instanceof Error ? error.message : demoCopy.status.synthesizeFailed);
      }
    }
  }, [text, tts, voice]);

  const handleStopClick = useCallback(() => {
    playbackRunIdRef.current += 1;
    tts.stop();
    stopTalkingHead(headRef.current);
    setStatus('idle');
    setStatusText(demoCopy.status.stopped);
  }, [tts]);

  const handlePrimaryActionClick = useCallback(() => {
    if (status === 'speaking') {
      handleStopClick();
      return;
    }

    void handlePlayClick();
  }, [handlePlayClick, handleStopClick, status]);

  const isBusy =
    status === 'loading-avatar' || status === 'loading-tts' || status === 'synthesizing';
  const isSpeaking = status === 'speaking';

  return {
    handleAdvancedToggle,
    handleAvatarMount,
    handleBackClick,
    handleCinematicModeClick,
    handlePlayClick,
    handlePrimaryActionClick,
    handleStopClick,
    handleTextChange,
    handleVoiceChange,
    isAdvancedOpen,
    isBusy,
    isCinematicMode,
    isSpeaking,
    status,
    statusText,
    text,
    voice,
    voices
  };
}
