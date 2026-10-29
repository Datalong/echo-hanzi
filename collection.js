/* collection.js — 生词收藏（Word Collection）
 *
 * 用户在微词典里点 ⭐ 收藏汉字；收藏的词会立即拿到一条
 * 「到期」的 SRS 记录，从而进入间隔重复的复习流。
 * 数据与 dict.js 的字级键一致：以单个汉字为收藏单位。
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'echo-hanzi:collection:v1';
  var MAX_ITEMS = 2000;

  function load() {
    var db = null;
    try {
      db = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (err) {
      db = null;
    }
    return db && typeof db === 'object' ? db : {};
  }

  function save(db) {
    try {
      // 超限时保留最新收藏
      var keys = Object.keys(db);
      if (keys.length > MAX_ITEMS) {
        keys.sort(function (a, b) { return (db[a].addedAt || 0) - (db[b].addedAt || 0); })
          .slice(0, keys.length - MAX_ITEMS)
          .forEach(function (k) { delete db[k]; });
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (err) { /* 隐私模式 / 配额不足时静默失败 */ }
  }

  function has(ch) {
    return !!load()[ch];
  }

  /**
   * 收藏 / 取消收藏，返回收藏后的状态 true=已收藏
   * @param {string} ch 单个汉字
   * @param {{pinyin?:string, english?:string}} [meta]
   */
  function toggle(ch, meta) {
    if (!ch) return false;
    var db = load();
    if (db[ch]) {
      delete db[ch];
      save(db);
      return false;
    }
    db[ch] = {
      pinyin: (meta && meta.pinyin) || '',
      english: (meta && meta.english) || '',
      addedAt: Date.now()
    };
    save(db);
    return true;
  }

  /** 最近收藏的字符数组（新的在前） */
  function recent(n) {
    var db = load();
    return Object.keys(db)
      .sort(function (a, b) { return (db[b].addedAt || 0) - (db[a].addedAt || 0); })
      .slice(0, n || 20);
  }

  function count() {
    return Object.keys(load()).length;
  }

  function reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) { /* ignore */ }
  }

  var api = {
    STORAGE_KEY: STORAGE_KEY,
    load: load,
    save: save,
    has: has,
    toggle: toggle,
    recent: recent,
    count: count,
    reset: reset
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Collection = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
