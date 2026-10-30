/* achievements.js — 成就徽章系统
 *
 * 12 枚成就，从现有数据（课程/SRS/统计/聊天/助教）推导，
 * 每次进入总览或完课触发检查，解锁时间落 localStorage。
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'echo-hanzi:ach:v1';

  var DEFS = [
    { id: 'first-lesson', icon: '🌱', name: '初来乍到', desc: '完成第 1 课', en: 'Finish your first lesson',
      check: function () { return lessonDone() >= 1; } },
    { id: 'lessons-5', icon: '📚', name: '小有所成', desc: '通关 5 课', en: 'Finish 5 lessons',
      check: function () { return lessonDone() >= 5; } },
    { id: 'lessons-all', icon: '🎓', name: 'HSK1 毕业', desc: '20 课全部通关', en: 'Finish all 20 lessons',
      check: function () { return lessonDone() >= 20; } },
    { id: 'stars-30', icon: '🌟', name: '摘星者', desc: '累计 30 颗星', en: 'Earn 30 stars',
      check: function () { return global.Course ? global.Course.progress().stars >= 30 : false; } },
    { id: 'srs-100', icon: '🧠', name: '百词斩', desc: '学过 100 个词句', en: 'Learn 100 items in SRS',
      check: function (srsDb) { return Object.keys(srsDb).length >= 100; } },
    { id: 'mastered-20', icon: '🏅', name: '长期记忆', desc: '20 个词句间隔 ≥21 天', en: 'Master 20 items',
      check: function (srsDb) {
        return Object.keys(srsDb).filter(function (k) { return srsDb[k].interval >= 21; }).length >= 20;
      } },
    { id: 'sessions-30', icon: '💪', name: '常客', desc: '累计练习 30 轮', en: '30 practice rounds',
      check: function () {
        var s = global.Stats ? global.Stats.summary(global.Stats.load()) : null;
        return !!(s && s.sessions >= 30);
      } },
    { id: 'cpm-60', icon: '⚡', name: '手速惊人', desc: '单轮 CPM ≥ 60', en: 'Hit 60 CPM in a round',
      check: function () {
        var db = global.Stats ? global.Stats.load() : { sessions: [] };
        return (db.sessions || []).some(function (s) { return (s.cpm || 0) >= 60; });
      } },
    { id: 'streak-50', icon: '🔥', name: '连击之神', desc: '单轮连击 50', en: '50-hit streak in a round',
      check: function () {
        var db = global.Stats ? global.Stats.load() : { sessions: [] };
        return (db.sessions || []).some(function (s) { return (s.streak || s.bestStreak || 0) >= 50; });
      } },
    { id: 'days-7', icon: '📅', name: '七日之约', desc: '连续打卡 7 天', en: '7-day streak',
      check: function () { return calcStreak >= 7; } },
    { id: 'tutor-10', icon: '🤖', name: '助教之友', desc: '与 AI 助教对话 10 次', en: '10 tutor messages',
      check: function () {
        if (!global.Tutor) return false;
        return global.Tutor.loadHistory().filter(function (m) { return m.role === 'user'; }).length >= 10;
      } },
    { id: 'chat-10', icon: '💬', name: '笔友上线', desc: '聊天场发送 10 条', en: '10 chat messages',
      check: function () {
        try {
          var h = JSON.parse(localStorage.getItem('echo-hanzi:chat:v1') || '[]');
          return Array.isArray(h) && h.filter(function (m) { return m.role === 'user'; }).length >= 10;
        } catch (err) { return false; }
      } }
  ];

  // —— 内部工具 ——
  var calcStreak = 0; // 由 app.js 注入每日连击

  function lessonDone() {
    return global.Course ? global.Course.progress().done : 0;
  }

  function load() {
    try {
      var db = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return db && typeof db === 'object' ? db : {};
    } catch (err) { return {}; }
  }

  function save(db) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch (err) { /* ignore */ }
  }

  /** 检查全部成就，解锁新达标的；返回新解锁 id 数组 */
  function checkAll(ctx) {
    if (ctx && typeof ctx.streak === 'number') calcStreak = ctx.streak;
    var db = load();
    var srsDb = ctx && ctx.srsDb ? ctx.srsDb : (global.Srs ? global.Srs.load() : {});
    var newly = [];
    DEFS.forEach(function (d) {
      if (db[d.id]) return;
      var ok = false;
      try { ok = !!d.check(srsDb); } catch (err) { ok = false; }
      if (ok) {
        db[d.id] = { unlockedAt: Date.now() };
        newly.push(d.id);
      }
    });
    if (newly.length) save(db);
    return newly;
  }

  function isUnlocked(id) { return !!load()[id]; }

  function count() { return Object.keys(load()).length; }

  var api = {
    STORAGE_KEY: STORAGE_KEY,
    DEFS: DEFS,
    load: load,
    checkAll: checkAll,
    isUnlocked: isUnlocked,
    count: count
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Achievements = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
