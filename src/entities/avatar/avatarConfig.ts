export type AvatarId =
  | 'brunette';

export type AvatarConfig = {
  id: AvatarId;
  label: string;
  notes: string;
  options: Record<string, unknown>;
};

const TALKING_HEAD_AVATARS_URL =
  'https://raw.githubusercontent.com/met4citizen/TalkingHead/v1.7.0/avatars';

export const AVATAR_CONFIGS: AvatarConfig[] = [
  {
    id: 'brunette',
    label: 'Brunette fallback',
    notes: 'Current best-looking confirmed fallback model from the TalkingHead examples.',
    options: {
      url: `${TALKING_HEAD_AVATARS_URL}/brunette.glb`,
      body: 'F',
      avatarMood: 'neutral',
      baseline: {
        headRotateX: 0,
        headRotateY: 0,
        headRotateZ: 0,
        eyesRotateX: 0,
        eyesRotateY: 0,
        eyeBlinkLeft: 0.12,
        eyeBlinkRight: 0.12
      }
    }
  }
];

export const DEFAULT_AVATAR_ID: AvatarId = 'brunette';

export function getAvatarConfig(id: AvatarId): AvatarConfig {
  return AVATAR_CONFIGS.find((avatar) => avatar.id === id) ?? AVATAR_CONFIGS[0];
}
