/* stats.js — 练习统计（数据看板的底层）
 *
 * 记录两类数据：
 *   1. sessions[]：每轮成绩 { t, mode, level, items, cpm, acc, chars, ms }
 *   2. 音节粒度的错误分布：
 *        initials { zh: {a: 尝试数, e: 出错音节数} }
 *        finals   { ang: {...} }
 *        tones    { 1..4, 5: {...} }
 *
 * 「出错」以音节为单位：只要该音节的任何一位打错，就记一次错。
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'echo-hanzi:stats:v1';
  var MAX_SESSIONS = 120;

  function empty() {
    return {
      sessions: [],
      syllables: 0,
      items: 0,
      initials: {},
      finals: {},
      tones: {}
    };
  }

  function load() {
    var db = null;
    try {
      db = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (err) {
      db = null;
    }
    if (!db || typeof db !== 'object') return empty();
    var base = empty();
    return {
      sessions: Array.isArray(db.sessions) ? db.sessions.slice(-MAX_SESSIONS) : base.sessions,
      syllables: db.syllables || 0,
      items: db.items || 0,
      initials: db.initials || {},
      finals: db.finals || {},
      tones: db.tones || {}
    };
  }

  function save(db) {
    try {
      if (db.sessions.length > MAX_SESSIONS) db.sessions = db.sessions.slice(-MAX_SESSIONS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (err) { /* 隐私模式 / 配额不足时忽略 */ }
  }

  function reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) { /* ignore */ }
  }

  function bump(bucket, key, isError) {
    if (!key) return;
    var rec = bucket[key] || (bucket[key] = { a: 0, e: 0 });
    rec.a++;
    if (isError) rec.e++;
  }

  /**
   * 记录一组音节的表现
   * @param {Array<{letters:string, tone:number, hadError:boolean}>} list
   */
  function recordSyllables(db, list) {
    var split = global.Pinyin.splitInitialFinal;
    list.forEach(function (syl) {
      var parts = split(syl.letters);
      var bad = !!syl.hadError;
      bump(db.initials, parts.initial || '(零声母)', bad);
      bump(db.finals, parts.final || parts.letters, bad);
      bump(db.tones, String(syl.tone || 5), bad);
      db.syllables++;
    });
  }

  function recordSession(db, session) {
    db.sessions.push(session);
    db.items += session.items || 0;
    if (db.sessions.length > MAX_SESSIONS) {
      db.sessions = db.sessions.slice(-MAX_SESSIONS);
    }
  }

  /** 把 {a,e} 表整理成按错误率排序的数组 */
  function rank(bucket, minAttempts) {
    var rows = [];
    for (var key in bucket) {
      if (!Object.prototype.hasOwnProperty.call(bucket, key)) continue;
      var rec = bucket[key];
      if (rec.a < (minAttempts || 1)) continue;
      rows.push({ key: key, attempts: rec.a, errors: rec.e, rate: rec.e / rec.a });
    }
    rows.sort(function (x, y) {
      if (y.rate !== x.rate) return y.rate - x.rate;
      return y.attempts - x.attempts;
    });
    return rows;
  }

  /** 总体概况 */
  function summary(db) {
    var sessions = db.sessions;
    var cpmSum = 0;
    var accSum = 0;
    var chars = 0;
    sessions.forEach(function (s) {
      cpmSum += s.cpm || 0;
      accSum += s.acc || 0;
      chars += s.chars || 0;
    });
    var n = sessions.length;
    return {
      sessions: n,
      items: db.items,
      syllables: db.syllables,
      chars: chars,
      avgCpm: n ? Math.round(cpmSum / n) : 0,
      avgAcc: n ? Math.round(accSum / n) : 0,
      bestCpm: sessions.reduce(function (m, s) { return Math.max(m, s.cpm || 0); }, 0)
    };
  }

  /** 按自然日聚合最近练习：dateStr -> {sessions, chars, items} */
  function dailyMap(db) {
    var map = {};
    (db.sessions || []).forEach(function (s) {
      if (!s.t) return;
      var key = new Date(s.t).toISOString().slice(0, 10);
      var rec = map[key] || (map[key] = { sessions: 0, chars: 0, items: 0 });
      rec.sessions++;
      rec.chars += s.chars || 0;
      rec.items += s.items || 0;
    });
    return map;
  }

  /** 经验值：每轮 = 完成题数×10 + 累计字符数 */
  function totalXp(db) {
    return (db.sessions || []).reduce(function (sum, s) {
      return sum + (s.items || 0) * 10 + (s.chars || 0);
    }, 0);
  }

  /** 等级：每级需要 level×200 经验，返回 {level, cur, need} */
  function level(db) {
    var xp = totalXp(db);
    var lvl = 1;
    var need = 200;
    while (xp >= need) {
      xp -= need;
      lvl++;
      need = lvl * 200;
    }
    return { level: lvl, cur: xp, need: need };
  }

  var api = {
    STORAGE_KEY: STORAGE_KEY,
    MAX_SESSIONS: MAX_SESSIONS,
    empty: empty,
    load: load,
    save: save,
    reset: reset,
    recordSyllables: recordSyllables,
    recordSession: recordSession,
    rank: rank,
    dailyMap: dailyMap,
    totalXp: totalXp,
    level: level,
    summary: summary
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Stats = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
