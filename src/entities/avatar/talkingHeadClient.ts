import { TalkingHead } from '@met4citizen/talkinghead';
import { DEFAULT_AVATAR_URL } from './avatarConfig';
import type { TalkingHeadInstance } from './types';

export async function createTalkingHead(container: HTMLElement): Promise<TalkingHeadInstance> {
  const head = new TalkingHead(container, {
    lipsyncModules: ['en'],
    lipsyncLang: 'en',
    cameraView: 'head',
    cameraDistance: 0.1,
    modelPixelRatio: Math.min(window.devicePixelRatio, 2),
    modelFPS: 30,
    mixerGainSpeech: 3
  });

  await head.showAvatar(
    {
      url: DEFAULT_AVATAR_URL,
      body: 'F',
      avatarMood: 'neutral',
      lipsyncLang: 'en',
      baseline: {
        headRotateX: -0.05,
        eyeBlinkLeft: 0.12,
        eyeBlinkRight: 0.12
      }
    },
    () => undefined
  );

  head.setView('head', {
    cameraDistance: 0.2,
    cameraY: 0.05
  });

  head.setLighting({
    lightAmbientIntensity: 2,
    lightDirectIntensity: 3
  });

  return head;
}

export function stopTalkingHead(head: TalkingHeadInstance | null): void {
  head?.stopSpeaking?.();
}
