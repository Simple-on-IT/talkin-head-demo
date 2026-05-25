import assert from 'node:assert/strict';
import { createRussianVisemeTimeline } from '../../src/entities/lipsync/russianVisemes';

const validVisemes = new Set([
  'aa',
  'CH',
  'DD',
  'E',
  'FF',
  'I',
  'kk',
  'nn',
  'O',
  'PP',
  'RR',
  'SS',
  'U'
]);

function assertValidTimeline(text: string, durationMs: number, startOffsetMs = 0): void {
  const timeline = createRussianVisemeTimeline(text, durationMs, startOffsetMs);

  assert.ok(timeline.visemes.length > 0, 'timeline should contain visemes');
  assert.equal(timeline.vtimes.length, timeline.visemes.length, 'vtimes length should match');
  assert.equal(timeline.vdurations.length, timeline.visemes.length, 'vdurations length should match');

  timeline.visemes.forEach((viseme) => {
    assert.ok(validVisemes.has(viseme), `unexpected viseme: ${viseme}`);
  });

  timeline.vtimes.forEach((time, index) => {
    assert.ok(Number.isInteger(time), `vtimes[${index}] should be an integer`);
    assert.ok(time >= 0, `vtimes[${index}] should be non-negative`);

    if (index > 0) {
      assert.ok(time >= timeline.vtimes[index - 1], 'vtimes should be non-decreasing');
    }
  });

  timeline.vdurations.forEach((duration, index) => {
    assert.ok(Number.isInteger(duration), `vdurations[${index}] should be an integer`);
    assert.ok(duration > 0, `vdurations[${index}] should be positive`);
  });
}

assertValidTimeline('Привет, я говорящий аватар.', 2600, 120);
assertValidTimeline('Быстрый тест губ: мама, фокус, чашка!', 4200);

const delayedTimeline = createRussianVisemeTimeline('Привет', 1000, 300);
assert.ok(delayedTimeline.vtimes[0] >= 0, 'lip lead should not create negative start times');

const emptyTimeline = createRussianVisemeTimeline('', 800);
assert.deepEqual(emptyTimeline.visemes, ['aa'], 'empty text should return a safe fallback viseme');
assert.deepEqual(emptyTimeline.vtimes, [0], 'empty fallback should start at zero');
assert.deepEqual(emptyTimeline.vdurations, [800], 'empty fallback should span the requested duration');

console.log('Russian viseme timeline tests passed');
