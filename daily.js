'use strict';

function localDate(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function recordCount(history, count, now = new Date()) {
  const date = localDate(now);
  const entries = { ...history };
  const previousDates = Object.keys(entries).filter(key => key < date).sort();
  const previous = previousDates.length ? entries[previousDates.at(-1)] : undefined;
  const existing = entries[date];
  const baseline = existing ? existing.baseline : previous ? previous.count : count;
  const partial = existing ? existing.partial : !previous;
  entries[date] = {
    baseline,
    count,
    partial,
    updatedAt: now.toISOString()
  };
  const recentDates = Object.keys(entries).sort().slice(-90);
  return Object.fromEntries(recentDates.map(key => [key, entries[key]]));
}

module.exports = { localDate, recordCount };
