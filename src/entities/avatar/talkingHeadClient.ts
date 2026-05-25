import { TalkingHead } from '@met4citizen/talkinghead';
import { LipsyncEn } from '@met4citizen/talkinghead/modules/lipsync-en.mjs';
import { DEFAULT_AVATAR_ID, getAvatarConfig } from './avatarConfig';
import type { AvatarId } from './avatarConfig';
import type { TalkingHeadInstance } from './types';

type TalkingHeadWithLipsync = TalkingHeadInstance & {
  lipsync: Record<string, LipsyncEn>;
};

export type TalkingHeadSceneMode = 'default' | 'cinematic';

declare global {
  interface Window {
    __talkingHeadDebug?: TalkingHeadInstance;
  }
}

const CAMERA_VIEW = 'upper';
const CAMERA_OPTIONS = {
  cameraDistance: -0.8,
  cameraY: 0,
  cameraRotateX: 0,
  cameraRotateY: 0
};

const LIGHTING_OPTIONS = {
  lightAmbientIntensity: 1.15,
  lightDirectIntensity: 4.4
};

const CINEMATIC_CAMERA_OPTIONS = {
  cameraDistance: -1.05,
  cameraY: -0.08,
  cameraRotateX: 0,
  cameraRotateY: -0.04
};

const CINEMATIC_LIGHTING_OPTIONS = {
  lightAmbientColor: 0x75658f,
  lightAmbientIntensity: 0.26,
  lightDirectColor: 0xffc8a8,
  lightDirectIntensity: 6.8,
  lightDirectPhi: 0.86,
  lightDirectTheta: 2.04,
  lightSpotColor: 0x8d6cff,
  lightSpotIntensity: 9.4,
  lightSpotPhi: 1.04,
  lightSpotTheta: 4.72,
  lightSpotDispersion: 0.68
};

const EYE_CONTACT_DURATION_MS = 3_600_000;
const START_HEAD_ROTATE_X = -0.04;
const START_HEAD_ROTATE_Y = 0;
const START_HEAD_ROTATE_Z = 0;

export async function createTalkingHead(
  container: HTMLElement,
  avatarId: AvatarId = DEFAULT_AVATAR_ID,
  sceneMode: TalkingHeadSceneMode = 'default'
): Promise<TalkingHeadInstance> {
  const cameraOptions = getCameraOptions(sceneMode);
  const head = new TalkingHead(container, {
    lipsyncModules: [],
    lipsyncLang: 'en',
    cameraView: CAMERA_VIEW,
    cameraDistance: cameraOptions.cameraDistance,
    cameraRotateEnable: false,
    cameraPanEnable: false,
    cameraZoomEnable: false,
    modelPixelRatio: Math.min(window.devicePixelRatio, 2),
    modelFPS: 30,
    mixerGainSpeech: 3,
    avatarIdleEyeContact: 1,
    avatarIdleHeadMove: 0,
    avatarSpeakingEyeContact: 1,
    avatarSpeakingHeadMove: 0.28,
    avatarListeningEyeContact: 1,
    avatarListeningHeadMove: 0
  });
  attachEnglishLipsync(head);

  await loadTalkingHeadAvatar(head, avatarId, sceneMode);

  if (import.meta.env.DEV) {
    window.__talkingHeadDebug = head;
  }

  return head;
}

export function stopTalkingHead(head: TalkingHeadInstance | null): void {
  head?.stopSpeaking?.();
}

export async function loadTalkingHeadAvatar(
  head: TalkingHeadInstance,
  avatarId: AvatarId,
  sceneMode: TalkingHeadSceneMode = 'default'
): Promise<void> {
  const avatar = getAvatarConfig(avatarId);

  head.stopSpeaking?.();
  await head.showAvatar(
    {
      ...avatar.options,
      lipsyncLang: 'en',
      avatarIdleEyeContact: 1,
      avatarIdleHeadMove: 0,
      avatarSpeakingEyeContact: 1,
      avatarSpeakingHeadMove: 0.28,
      avatarListeningEyeContact: 1,
      avatarListeningHeadMove: 0,
      avatarIgnoreCamera: false
    },
    () => undefined
  );

  head.setView(CAMERA_VIEW, getCameraOptions(sceneMode));
  head.setLighting(getLightingOptions(sceneMode));
  setNeutralHeadPose(head);
  head.makeEyeContact(EYE_CONTACT_DURATION_MS);
}

function attachEnglishLipsync(head: TalkingHeadInstance): void {
  const target = head as TalkingHeadWithLipsync;
  target.lipsync.en = new LipsyncEn();
}

function getCameraOptions(sceneMode: TalkingHeadSceneMode): typeof CAMERA_OPTIONS {
  return sceneMode === 'cinematic' ? CINEMATIC_CAMERA_OPTIONS : CAMERA_OPTIONS;
}

function getLightingOptions(sceneMode: TalkingHeadSceneMode): typeof LIGHTING_OPTIONS {
  return sceneMode === 'cinematic' ? CINEMATIC_LIGHTING_OPTIONS : LIGHTING_OPTIONS;
}

function setNeutralHeadPose(head: TalkingHeadInstance): void {
  head.setValue('headRotateX', START_HEAD_ROTATE_X, 0);
  head.setValue('headRotateY', START_HEAD_ROTATE_Y, 0);
  head.setValue('headRotateZ', START_HEAD_ROTATE_Z, 0);
  head.setValue('bodyRotateX', 0, 0);
  head.setValue('bodyRotateY', 0, 0);
  head.setValue('bodyRotateZ', 0, 0);
}
