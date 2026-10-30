/* course.js — 课程化学习路径 (Course Map)
 *
 * 把 HSK 1 的 150 词切成 20 节主题课，关卡式解锁：
 *   第 1 课默认解锁，通关上一课（正确率 ≥60%）解锁下一课。
 *   每课 1-3 星：>=60% 一星，>=75% 两星，>=90% 三星。
 *   完课数据写 localStorage，并与 SRS 排期天然衔接。
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'echo-hanzi:course:v1';

  var LESSONS = [
    { id: 'l01', title: '你好！打招呼', words: ['你', '我', '他', '她', '好', '再见', '谢谢', '对不起', '没关系'] },
    { id: 'l02', title: '数字一到十', words: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'] },
    { id: 'l03', title: '我的家', words: ['爸爸', '妈妈', '儿子', '女儿', '家', '狗', '猫'] },
    { id: 'l04', title: '人和称呼', words: ['先生', '小姐', '老师', '同学', '朋友', '名字', '叫', '谁', '人'] },
    { id: 'l05', title: '今天与现在', words: ['今天', '明天', '昨天', '现在', '上午', '下午', '中午', '时候'] },
    { id: 'l06', title: '年月与年龄', words: ['年', '月', '星期', '岁', '几', '号', '点', '分钟'] },
    { id: 'l07', title: '天气冷热', words: ['天气', '热', '冷', '下雨', '太', '都', '很', '漂亮'] },
    { id: 'l08', title: '吃喝', words: ['吃', '喝', '米饭', '菜', '茶', '水', '苹果', '水果', '杯子'] },
    { id: 'l09', title: '购物花钱', words: ['买', '东西', '商店', '钱', '块', '本', '不客气'] },
    { id: 'l10', title: '城市地点', words: ['北京', '中国', '饭店', '火车站', '医院', '学校'] },
    { id: 'l11', title: '方位', words: ['这', '那', '里', '前面', '后面', '上', '下'] },
    { id: 'l12', title: '提问', words: ['在', '哪', '哪儿', '吗', '呢', '什么', '怎么', '怎么样'] },
    { id: 'l13', title: '动作：来去', words: ['去', '回', '来', '坐', '开', '看', '读', '写', '听', '说'] },
    { id: 'l14', title: '动作：生活', words: ['打电话', '睡觉', '认识', '想', '做', '住'] },
    { id: 'l15', title: '是和有没有', words: ['是', '有', '没有', '不', '能', '些'] },
    { id: 'l16', title: '大小多少', words: ['大', '小', '多', '多少', '少', '我们', '了'] },
    { id: 'l17', title: '书桌与屏幕', words: ['电脑', '电视', '电影', '椅子', '桌子', '书', '看见', '会', '字'] },
    { id: 'l18', title: '出行与穿着', words: ['飞机', '出租车', '衣服', '医生', '喂', '请'] },
    { id: 'l19', title: '学习汉语', words: ['汉语', '学习', '学生', '爱', '高兴', '喜欢'] },
    { id: 'l20', title: '工作与别的', words: ['工作', '个', '的', '和'] },
  ];

  function load() {
    try {
      var db = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return db && typeof db === 'object' ? db : {};
    } catch (err) { return {}; }
  }

  function save(db) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch (err) { /* ignore */ }
  }

  /** 完课并评星，返回记录 */
  function complete(lessonId, stars) {
    var db = load();
    var rec = db[lessonId] || { stars: 0, attempts: 0 };
    rec.attempts++;
    rec.stars = Math.max(rec.stars, stars);
    rec.completedAt = Date.now();
    db[lessonId] = rec;
    save(db);
    return rec;
  }

  /** 第 index 课（0 起）是否解锁 */
  function isUnlocked(index) {
    if (index === 0) return true;
    var db = load();
    var prev = db[LESSONS[index - 1].id];
    return !!(prev && prev.stars > 0);
  }

  function starsOf(lessonId) {
    var db = load();
    return (db[lessonId] && db[lessonId].stars) || 0;
  }

  function progress() {
    var db = load();
    var done = 0;
    var stars = 0;
    LESSONS.forEach(function (l) {
      var s = starsOf(l.id);
      if (s > 0) done++;
      stars += s;
    });
    return { done: done, total: LESSONS.length, stars: stars, maxStars: LESSONS.length * 3 };
  }

  /** 把 hanzi 数组映射为 WORD_LISTS 里的题目对象（引用同一对象，SRS 键一致） */
  function lessonItems(lesson) {
    var pool = (global.WORD_LISTS && global.WORD_LISTS.hsk1) || [];
    var out = [];
    lesson.words.forEach(function (hz) {
      for (var i = 0; i < pool.length; i++) {
        if (pool[i].hanzi === hz) { out.push(pool[i]); return; }
      }
    });
    return out;
  }

  var api = {
    STORAGE_KEY: STORAGE_KEY,
    LESSONS: LESSONS,
    load: load,
    complete: complete,
    isUnlocked: isUnlocked,
    starsOf: starsOf,
    progress: progress,
    lessonItems: lessonItems
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Course = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
