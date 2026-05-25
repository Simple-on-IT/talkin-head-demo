const russianVisemes: Record<string, string> = {
  а: 'aa',
  б: 'PP',
  в: 'FF',
  г: 'kk',
  д: 'DD',
  е: 'E',
  ё: 'O',
  ж: 'CH',
  з: 'SS',
  и: 'I',
  й: 'I',
  к: 'kk',
  л: 'nn',
  м: 'PP',
  н: 'nn',
  о: 'O',
  п: 'PP',
  р: 'RR',
  с: 'SS',
  т: 'DD',
  у: 'U',
  ф: 'FF',
  х: 'kk',
  ц: 'SS',
  ч: 'CH',
  ш: 'CH',
  щ: 'CH',
  ы: 'I',
  э: 'E',
  ю: 'U',
  я: 'aa'
};

const pronunciationOverrides: Record<string, string> = {
  аватар: 'аватар',
  браузере: 'браузире',
  говорящий: 'гаварящий',
  который: 'каторый',
  привет: 'привет',
  прямо: 'прямо',
  работает: 'работаэт'
};

const softLetters = new Set(['я', 'ё', 'ю', 'и', 'ь', 'е']);
const syllableStartLetters = new Set(['#', 'ъ', 'ь', 'а', 'я', 'о', 'ё', 'у', 'ю', 'э', 'е', 'и', 'ы', '-']);
const ignoredPhoneMarkers = new Set(['#', '+', '-', 'ь', 'ъ']);

const softHardConsonants: Record<string, string> = {
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  з: 'z',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  ф: 'f',
  х: 'h'
};

const otherConsonants: Record<string, string> = {
  ж: 'zh',
  й: 'j',
  ц: 'c',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch'
};

const russianVowelsToPhones: Record<string, string> = {
  а: 'a',
  е: 'e',
  ё: 'o',
  и: 'i',
  о: 'o',
  у: 'u',
  ы: 'y',
  э: 'e',
  ю: 'u',
  я: 'a'
};

const phoneToViseme: Record<string, string> = {
  a0: 'aa',
  a1: 'aa',
  b: 'PP',
  bj: 'PP',
  c: 'SS',
  ch: 'CH',
  d: 'DD',
  dj: 'CH',
  e0: 'E',
  e1: 'E',
  f: 'FF',
  fj: 'FF',
  g: 'kk',
  gj: 'kk',
  h: 'kk',
  hj: 'kk',
  i0: 'I',
  i1: 'I',
  j: 'I',
  k: 'kk',
  kj: 'kk',
  l: 'DD',
  lj: 'DD',
  m: 'PP',
  mj: 'PP',
  n: 'nn',
  nj: 'nn',
  o0: 'O',
  o1: 'O',
  p: 'PP',
  pj: 'PP',
  r: 'RR',
  rj: 'RR',
  s: 'SS',
  sch: 'SS',
  sh: 'SS',
  sj: 'SS',
  t: 'DD',
  tj: 'DD',
  u0: 'U',
  u1: 'U',
  v: 'FF',
  vj: 'FF',
  y0: 'I',
  y1: 'I',
  z: 'SS',
  zh: 'SS',
  zj: 'SS'
};

const visemeWeights: Record<string, number> = {
  aa: 1.35,
  E: 1.2,
  I: 1.1,
  O: 1.3,
  U: 1.2,
  PP: 1.05,
  FF: 1,
  SS: 0.45,
  CH: 0.85,
  DD: 0.45,
  kk: 0.42,
  nn: 0.5,
  RR: 0.38,
  sil: 1
};

const maxPauseShare = 0.42;
const minVisemeMs = 95;
const minReadableVisemeMs = 115;
const lipLeadMs = 95;
const defaultDurationScale = 1.12;
const vowelDurationBoostMs = 55;
const labialDurationBoostMs = 40;

type VisemeUnit = {
  durationWeight: number;
  viseme: string;
};

type TextSegment = {
  phones: string[];
  type: 'speech' | 'pause';
  weight: number;
};

export type RussianVisemeTimeline = {
  vdurations: number[];
  visemes: string[];
  vtimes: number[];
};

export function createRussianVisemeTimeline(
  text: string,
  durationMs: number,
  startOffsetMs = 0
): RussianVisemeTimeline {
  const segments = createTextSegments(text);
  const speechSegments = segments.filter(isSpeechSegment);

  if (speechSegments.length === 0 || durationMs <= 0) {
    return {
      vdurations: [Math.max(0, durationMs)],
      visemes: ['aa'],
      vtimes: [Math.max(0, Math.round(startOffsetMs))]
    };
  }

  const rawPauseWeight = segments
    .filter(isPauseSegment)
    .reduce((sum, item) => sum + item.weight, 0);
  const cappedPauseMs = Math.min(durationMs * maxPauseShare, rawPauseWeight * 210);
  const speechDurationMs = Math.max(durationMs - cappedPauseMs, durationMs * 0.55);
  const speechWeight = speechSegments.reduce((sum, item) => sum + item.weight, 0);
  const pauseScale = rawPauseWeight > 0 ? cappedPauseMs / rawPauseWeight : 0;
  const segmentDurations = segments.map((segment) =>
    segment.type === 'pause'
      ? segment.weight * pauseScale
      : (segment.weight / speechWeight) * speechDurationMs
  );
  let elapsed = 0;

  const timeline = segments.reduce<RussianVisemeTimeline>((result, segment, index) => {
    const isLast = index === segments.length - 1;
    const segmentDuration = isLast
      ? Math.max(0, durationMs - elapsed)
      : segmentDurations[index];

    if (segment.type === 'pause') {
      elapsed += segmentDuration;
      return result;
    }

    const nextPauseDuration = segments[index + 1]?.type === 'pause' ? segmentDurations[index + 1] : 0;
    const reservedPauseLeadOut = Math.min(nextPauseDuration * 0.75, segmentDuration * 0.42, 260);
    const activeDuration = Math.max(segmentDuration - reservedPauseLeadOut, segmentDuration * 0.5);

    appendSpeechSegment(result, segment.phones, elapsed, activeDuration);
    elapsed += segmentDuration;

    return result;
  }, createEmptyTimeline());

  widenReadableMouthShapes(timeline, durationMs);
  shiftTimeline(timeline, startOffsetMs);

  return timeline;
}

function createTextSegments(text: string): TextSegment[] {
  const chars = text.toLowerCase().normalize('NFC').split('');
  const segments: TextSegment[] = [];
  let currentWord = '';

  chars.forEach((char) => {
    if (russianVisemes[char]) {
      currentWord += char;
      return;
    }

    if (currentWord) {
      segments.push(createSpeechSegment(currentWord));
      currentWord = '';
    }

    const pauseWeight = getPauseWeight(char);
    if (pauseWeight > 0) {
      appendPauseSegment(segments, pauseWeight);
    }
  });

  if (currentWord) {
    segments.push(createSpeechSegment(currentWord));
  }

  return segments;
}

function createSpeechSegment(chars: string): TextSegment {
  const phones = createRussianPhoneTokens(chars);
  const weight = phones.reduce((sum, phone) => sum + getPhoneWeight(phone), 0);

  return {
    phones,
    type: 'speech',
    weight: Math.max(1, weight)
  };
}

function appendSpeechSegment(
  timeline: RussianVisemeTimeline,
  phones: string[],
  startMs: number,
  durationMs: number
): void {
  const units = phones.reduce<VisemeUnit[]>((items, phone) => appendVisemeUnit(items, phone), []);
  const durationFloor =
    durationMs / Math.max(1, units.length) >= minVisemeMs
      ? minVisemeMs
      : Math.max(12, (durationMs / Math.max(1, units.length)) * 0.5);
  const readableUnits = reduceToReadableUnits(units, durationMs);
  const readableTotalWeight = readableUnits.reduce((sum, item) => sum + item.durationWeight, 0);
  let elapsed = startMs;

  readableUnits.forEach((item, index) => {
    const isLast = index === readableUnits.length - 1;
    const duration = isLast
      ? Math.max(durationFloor, startMs + durationMs - elapsed)
      : Math.max(durationFloor, (item.durationWeight / readableTotalWeight) * durationMs);

    timeline.visemes.push(item.viseme);
    timeline.vtimes.push(Math.round(elapsed));
    timeline.vdurations.push(Math.round(duration));
    elapsed += duration;
  });
}

function reduceToReadableUnits(units: VisemeUnit[], durationMs: number): VisemeUnit[] {
  const maxUnits = Math.max(1, Math.floor(durationMs / minReadableVisemeMs));

  if (units.length <= maxUnits) {
    return units;
  }

  const selectedIndexes = new Set<number>();
  const primaryVowelIndex = findPrimaryVowelIndex(units);
  const firstLabialIndex = units.findIndex((unit) => unit.viseme === 'PP');
  const firstFricativeIndex = units.findIndex((unit) => unit.viseme === 'FF' || unit.viseme === 'CH');

  if (primaryVowelIndex >= 0) {
    selectedIndexes.add(primaryVowelIndex);
  }

  if (selectedIndexes.size < maxUnits && firstLabialIndex >= 0) {
    selectedIndexes.add(firstLabialIndex);
  }

  if (selectedIndexes.size < maxUnits && firstFricativeIndex >= 0) {
    selectedIndexes.add(firstFricativeIndex);
  }

  for (let index = 0; index < units.length && selectedIndexes.size < maxUnits; index++) {
    if (isReadableViseme(units[index].viseme)) {
      selectedIndexes.add(index);
    }
  }

  for (let index = 0; index < units.length && selectedIndexes.size < maxUnits; index++) {
    selectedIndexes.add(index);
  }

  const reduced: VisemeUnit[] = [];
  [...selectedIndexes].sort((left, right) => left - right).forEach((index) => {
    const unit = units[index];
    appendOrMerge(reduced, {
      durationWeight: unit.durationWeight,
      viseme: unit.viseme
    });
  });

  return reduced;
}

function appendVisemeUnit(items: VisemeUnit[], phone: string): VisemeUnit[] {
  const viseme = phoneToViseme[phone] ?? russianVisemes[phone];

  if (viseme) {
    if (!shouldKeepConsonantViseme(items, viseme)) {
      return items;
    }

    appendOrMerge(items, {
      durationWeight: visemeWeights[viseme] ?? 1,
      viseme
    });
    return items;
  }

  const pauseWeight = getPauseWeight(phone);
  if (pauseWeight > 0) {
    appendOrMerge(items, {
      durationWeight: pauseWeight,
      viseme: 'sil'
    });
  }

  return items;
}

function appendPauseSegment(segments: TextSegment[], weight: number): void {
  const previous = segments[segments.length - 1];

  if (previous?.type === 'pause') {
    previous.weight += weight;
    return;
  }

  segments.push({
    phones: [],
    type: 'pause',
    weight
  });
}

function appendOrMerge(items: VisemeUnit[], unit: VisemeUnit): void {
  const previous = items[items.length - 1];

  if (previous?.viseme === unit.viseme) {
    previous.durationWeight += unit.durationWeight * 0.7;
    return;
  }

  items.push(unit);
}

function createEmptyTimeline(): RussianVisemeTimeline {
  return {
    vdurations: [],
    visemes: [],
    vtimes: []
  };
}

function createRussianPhoneTokens(word: string): string[] {
  const override = pronunciationOverrides[word];
  const normalizedWord = override ?? normalizeRussianPronunciation(word);
  const phones = convertRussianWordToPhones(normalizedWord);

  return phones.length ? phones : normalizedWord.split('');
}

function normalizeRussianPronunciation(word: string): string {
  if (pronunciationOverrides[word]) {
    return pronunciationOverrides[word];
  }

  const chars = word.split('');
  const stressedVowelIndex = findApproximateStressIndex(chars);

  return chars
    .map((char, index) => normalizeRussianSound(char, index, stressedVowelIndex, chars))
    .join('');
}

function convertRussianWordToPhones(word: string): string[] {
  const chars = `#${word}#`.split('');
  const stressedVowelIndex = findApproximateStressIndex(word.split(''));
  const phones = chars.map<[string, number]>((char, index) => {
    const wordIndex = index - 1;
    const stress = wordIndex === stressedVowelIndex ? 1 : 0;
    return [char, stress];
  });

  palatalizePhones(phones);

  return convertVowelsToPhones(phones).filter((phone) => !ignoredPhoneMarkers.has(phone));
}

function palatalizePhones(phones: Array<[string, number]>): void {
  for (let index = 0; index < phones.length - 1; index++) {
    const phone = phones[index][0];
    const nextPhone = phones[index + 1][0];
    const softHardPhone = softHardConsonants[phone];
    const otherPhone = otherConsonants[phone];

    if (softHardPhone) {
      phones[index][0] = `${softHardPhone}${softLetters.has(nextPhone) ? 'j' : ''}`;
    }

    if (otherPhone) {
      phones[index][0] = otherPhone;
    }
  }
}

function convertVowelsToPhones(phones: Array<[string, number]>): string[] {
  const result: string[] = [];
  let previousPhone = '';

  phones.forEach(([phone, stress]) => {
    if (syllableStartLetters.has(previousPhone) && ['е', 'ё', 'ю', 'я'].includes(phone)) {
      result.push('j');
    }

    const vowelPhone = russianVowelsToPhones[phone];
    result.push(vowelPhone ? `${vowelPhone}${stress}` : phone);
    previousPhone = phone;
  });

  return result;
}

function normalizeRussianSound(
  char: string,
  index: number,
  stressedVowelIndex: number,
  chars: string[]
): string {
  if (char === 'ь' || char === 'ъ') {
    return '';
  }

  if (char === 'о' && index !== stressedVowelIndex) {
    return 'а';
  }

  if (char === 'е' && shouldReduceFrontVowel(index, stressedVowelIndex, chars)) {
    return 'и';
  }

  if (char === 'я' && shouldReduceFrontVowel(index, stressedVowelIndex, chars)) {
    return 'и';
  }

  if (char === 'ю' && shouldReduceFrontVowel(index, stressedVowelIndex, chars)) {
    return 'у';
  }

  return char;
}

function findApproximateStressIndex(chars: string[]): number {
  const yoIndex = chars.indexOf('ё');

  if (yoIndex >= 0) {
    return yoIndex;
  }

  const vowelIndexes = chars
    .map((char, index) => (isRussianVowel(char) ? index : -1))
    .filter((index) => index >= 0);

  if (vowelIndexes.length <= 1) {
    return vowelIndexes[0] ?? -1;
  }

  return vowelIndexes[Math.max(0, vowelIndexes.length - 2)];
}

function shouldReduceFrontVowel(
  index: number,
  stressedVowelIndex: number,
  chars: string[]
): boolean {
  return index !== stressedVowelIndex && index > 0 && !isRussianVowel(chars[index - 1]);
}

function shouldKeepConsonantViseme(items: VisemeUnit[], viseme: string): boolean {
  if (isVowelViseme(viseme) || viseme === 'PP' || viseme === 'FF') {
    return true;
  }

  const previous = items[items.length - 1]?.viseme;

  if (!previous || isVowelViseme(previous)) {
    return true;
  }

  return viseme === 'CH' && previous !== 'CH';
}

function shiftTimeline(timeline: RussianVisemeTimeline, offsetMs: number): void {
  const roundedOffset = Math.round(offsetMs - lipLeadMs);
  timeline.vtimes = timeline.vtimes.map((time) => Math.max(0, time + roundedOffset));
}

function widenReadableMouthShapes(timeline: RussianVisemeTimeline, durationMs: number): void {
  timeline.vdurations = timeline.vdurations.map((duration, index) => {
    const viseme = timeline.visemes[index];
    const boost = getDurationBoostMs(viseme);
    const nextTime = timeline.vtimes[index + 1] ?? durationMs;
    const maxDuration = Math.max(duration, nextTime - timeline.vtimes[index] + 90);

    return Math.round(Math.min(duration * defaultDurationScale + boost, maxDuration));
  });
}

function getDurationBoostMs(viseme: string): number {
  if (isVowelViseme(viseme)) {
    return vowelDurationBoostMs;
  }

  if (viseme === 'PP' || viseme === 'FF') {
    return labialDurationBoostMs;
  }

  return 0;
}

function getPhoneWeight(phone: string): number {
  const viseme = phoneToViseme[phone] ?? russianVisemes[phone];
  return visemeWeights[viseme] ?? 1;
}

function isReadableViseme(viseme: string): boolean {
  return ['aa', 'E', 'I', 'O', 'U', 'PP', 'FF', 'CH'].includes(viseme);
}

function isVowelViseme(viseme: string): boolean {
  return ['aa', 'E', 'I', 'O', 'U'].includes(viseme);
}

function isRussianVowel(char: string): boolean {
  return ['а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я'].includes(char);
}

function findPrimaryVowelIndex(units: VisemeUnit[]): number {
  const vowelPriority = ['aa', 'O', 'E', 'U', 'I'];
  let bestIndex = -1;
  let bestScore = -1;

  units.forEach((unit, index) => {
    const priority = vowelPriority.indexOf(unit.viseme);
    if (priority < 0) {
      return;
    }

    const score = vowelPriority.length - priority;
    if (score > bestScore || (score === bestScore && index > bestIndex)) {
      bestIndex = index;
      bestScore = score;
    }
  });

  return bestIndex;
}

function getPauseWeight(char: string): number {
  if (/\s/.test(char)) {
    return 0.8;
  }

  if (/[,.]/.test(char)) {
    return 1.8;
  }

  if (/[!?]/.test(char)) {
    return 2.4;
  }

  if (/[-:;]/.test(char)) {
    return 1.3;
  }

  return 0;
}

function isPauseSegment(segment: TextSegment): boolean {
  return segment.type === 'pause';
}

function isSpeechSegment(segment: TextSegment): boolean {
  return segment.type === 'speech';
}
