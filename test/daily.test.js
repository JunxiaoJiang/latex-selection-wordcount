'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { localDate, recordCount } = require('../daily');

test('first observation establishes a partial baseline; later saves show net growth', () => {
  const morning = new Date(2026, 9, 22, 9);
  const evening = new Date(2026, 9, 22, 18);
  const first = recordCount({}, 1000, morning);
  assert.deepEqual(first[localDate(morning)].baseline, 1000);
  assert.equal(first[localDate(morning)].partial, true);
  const second = recordCount(first, 1150, evening);
  assert.equal(second[localDate(evening)].count - second[localDate(evening)].baseline, 150);
});

test('a new day uses the last observed total and preserves negative changes', () => {
  const dayOne = new Date(2026, 9, 22, 18);
  const dayTwo = new Date(2026, 9, 23, 9);
  const first = recordCount({}, 1150, dayOne);
  const second = recordCount(first, 1100, dayTwo);
  assert.equal(second[localDate(dayTwo)].baseline, 1150);
  assert.equal(second[localDate(dayTwo)].count - second[localDate(dayTwo)].baseline, -50);
  assert.equal(second[localDate(dayTwo)].partial, false);
});
