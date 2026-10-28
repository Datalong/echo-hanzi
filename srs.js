/* srs.js — 轻量间隔重复排程（FSRS/SM-2 简化版）
 *
 * 每题一条记录：
 *   { reps, lapses, interval, due, seen, errors, last }
 * - 一次答对（无错字）：间隔 1 天 → 3 天 → ×2.3 递增（上限 180 天）
 * - 出过错：间隔归零，10 分钟后再来（relearning）
 *
 * 记录按「类型 + 汉字」做键，词与句互不干扰。
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'echo-hanzi:srs:v1';
  var DAY = 24 * 60 * 60 * 1000;
  var AGAIN_MS = 10 * 60 * 1000;   // 答错后 10 分钟再来
  var MAX_INTERVAL_DAYS = 180;
  var MAX_RECORDS = 4000;

  function keyOf(item) {
    return (item && item.kind === 'sentence' ? 's:' : 'w:') + (item ? item.hanzi : '');
  }

  function load() {
    var db = null;
    try {
      db = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (err) {
      db = null;
    }
    return db && typeof db === 'object' ? db : {};
  }

  function prune(db) {
    var keys = Object.keys(db);
    if (keys.length <= MAX_RECORDS) return db;
    keys
      .sort(function (a, b) { return (db[a].last || 0) - (db[b].last || 0); })
      .slice(0, keys.length - MAX_RECORDS)
      .forEach(function (k) { delete db[k]; });
    return db;
  }

  function save(db) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prune(db)));
    } catch (err) { /* 隐私模式 / 配额不足时静默失败 */ }
  }

  function reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) { /* ignore */ }
  }

  /** 记录一次作答，返回更新后的记录 */
  function schedule(db, item, clean, now) {
    var t = now || Date.now();
    var key = keyOf(item);
    var rec = db[key] || {
      reps: 0, lapses: 0, interval: 0, due: 0, seen: 0, errors: 0, last: 0
    };

    rec.seen++;
    rec.last = t;

    if (clean) {
      rec.reps++;
      if (rec.reps === 1) rec.interval = 1;
      else if (rec.reps === 2) rec.interval = 3;
      else rec.interval = Math.min(MAX_INTERVAL_DAYS, Math.round(rec.interval * 2.3));
      rec.due = t + rec.interval * DAY;
    } else {
      rec.errors++;
      rec.lapses++;
      rec.reps = 0;
      rec.interval = 0;
      rec.due = t + AGAIN_MS;
    }

    db[key] = rec;
    return rec;
  }

  /** 从题池里挑出已到期的题（最早到期的在前） */
  function dueItems(db, pool, now) {
    var t = now || Date.now();
    var out = [];
    pool.forEach(function (item) {
      var rec = db[keyOf(item)];
      if (rec && rec.due && rec.due <= t) out.push({ item: item, due: rec.due });
    });
    out.sort(function (a, b) { return a.due - b.due; });
    return out;
  }

  /** 统计整体状态，用于界面展示 */
  function stats(db, pool, now) {
    var t = now || Date.now();
    var due = 0;
    var learning = 0;
    var mastered = 0;
    pool.forEach(function (item) {
      var rec = db[keyOf(item)];
      if (!rec) return;
      if (rec.due && rec.due <= t) due++;
      if (rec.reps > 0) learning++;
      if (rec.interval >= 21) mastered++;
    });
    return { due: due, learning: learning, mastered: mastered };
  }

  var api = {
    STORAGE_KEY: STORAGE_KEY,
    DAY: DAY,
    AGAIN_MS: AGAIN_MS,
    MAX_INTERVAL_DAYS: MAX_INTERVAL_DAYS,
    keyOf: keyOf,
    load: load,
    save: save,
    reset: reset,
    schedule: schedule,
    dueItems: dueItems,
    stats: stats
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Srs = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
