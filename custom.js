/* custom.js — 用户自定义内容导入管理（localStorage 持久化）
 * 将用户粘贴的任意中文文本自动切分为句子，接入全套练习管道
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'echo-hanzi:custom:v1';

  function load() {
    try {
      var arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function save(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
    } catch (e) { /* ignore */ }
  }

  function add(title, text) {
    var sentences = splitSentences(text);
    if (!sentences.length) return null;
    var items = load();
    var entry = {
      id: 'custom-' + Date.now(),
      title: title || '自定义练习',
      createdAt: Date.now(),
      sentences: sentences
    };
    items.unshift(entry);
    save(items);
    return entry;
  }

  function remove(id) {
    var items = load().filter(function (e) { return e.id !== id; });
    save(items);
  }

  function getById(id) {
    return load().filter(function (e) { return e.id === id; })[0] || null;
  }

  /** 将自由文本切分为句子（支持中英文标点，按句末符号或长度切分） */
  function splitSentences(text) {
    var raw = String(text || '').trim();
    if (!raw) return [];
    var pieces = raw
      .split(/(?<=[。！？!?\n])/)
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; });

    var out = [];
    pieces.forEach(function (piece) {
      // 超长片段再按逗号/顿号二次切分，每段不超过 12 个汉字
      if (Array.from(piece).length <= 14) {
        out.push(piece);
        return;
      }
      var sub = piece.split(/(?<=[，,、；;：:])/);
      var buf = '';
      sub.forEach(function (frag) {
        buf += frag;
        if (Array.from(buf).length >= 10) {
          out.push(buf.trim());
          buf = '';
        }
      });
      if (buf.trim()) out.push(buf.trim());
    });

    return out.filter(function (s) { return /[\u4e00-\u9fa5]/.test(s); });
  }

  /** 把句子转成与 WORD_LISTS 相同结构的练习条目 */
  function toItems(entry) {
    var guess = buildGuessPinyin();
    return (entry.sentences || []).map(function (hz, idx) {
      return {
        hanzi: hz,
        pinyin: guess(hz),
        english: '',
        level: 'Custom',
        kind: 'sentence',
        isCustom: true,
        customId: entry.id,
        lineIndex: idx,
        totalLines: entry.sentences.length
      };
    });
  }

  /** 反转 Ime 的拼音→汉字候选表，构建汉字→拼音反查字典（带调） */
  var charPinyinMap = null;
  var TONE_MARKS = {
    'a': ['ā','á','ǎ','à'], 'o': ['ō','ó','ǒ','ò'], 'e': ['ē','é','ě','è'],
    'i': ['ī','í','ǐ','ì'], 'u': ['ū','ú','ǔ','ù'], 'v': ['ǖ','ǘ','ǚ','ǜ']
  };

  function applyTone(syl, tone) {
    if (!tone || tone === 5) return syl;
    var letters = syl.split('');
    // 标调规则：优先韵母主元音 a/o/e，其次末尾的 i/u/v
    var order = ['a', 'o', 'e', 'v', 'i', 'u'];
    for (var k = 0; k < order.length; k++) {
      var idx = letters.indexOf(order[k]);
      if (idx !== -1) {
        letters[idx] = TONE_MARKS[order[k]][tone - 1];
        return letters.join('');
      }
    }
    return syl;
  }

  function buildGuessPinyin() {
    if (charPinyinMap) return guessPinyin;
    charPinyinMap = {};
    if (global.Ime && global.Ime.CANDIDATE_TABLE) {
      var table = global.Ime.CANDIDATE_TABLE;
      Object.keys(table).forEach(function (py) {
        (table[py] || []).forEach(function (ch) {
          if (!charPinyinMap[ch]) charPinyinMap[ch] = py;
        });
      });
    }
    return guessPinyin;
  }

  /** 为一段汉字生成带调拼音（用空格连接，未收录的字用 '?' 占位） */
  function guessPinyin(hanzi) {
    if (!charPinyinMap) buildGuessPinyin();
    var map = charPinyinMap;
    var tones = buildToneMap();
    return Array.from(String(hanzi || ''))
      .map(function (ch) {
        if (/[，。！？：；、,.!?;:\s]/.test(ch)) return ch;
        var entry = map[ch];
        if (!entry) return '?';
        var base = entry.replace(/\d+$/, '');
        var tone = parseInt((entry.match(/\d+$/) || [0])[0], 10);
        return applyTone(base, tone);
      })
      .join(' ');
  }

  /** Ime 候选表本身无声调，补一个常用字声调表（仅对已有字生效） */
  var toneMap = null;
  function buildToneMap() {
    if (toneMap) return toneMap;
    toneMap = {
      '你': 3, '好': 3, '中': 1, '国': 2, '大': 4, '小': 3, '人': 2, '吃': 1,
      '喝': 1, '茶': 2, '水': 3, '电': 4, '话': 4, '猫': 1, '狗': 3, '家': 1,
      '看': 4, '听': 1, '说': 1, '写': 3, '学': 2, '生': 1, '师': 1, '朋': 2,
      '友': 3, '爱': 4, '北': 3, '京': 1, '飞': 1, '机': 1, '高': 1, '兴': 4,
      '今': 1, '天': 1, '气': 4, '很': 3, '我': 3, '他': 1, '她': 1, '们': 5,
      '一': 1, '二': 4, '三': 1, '四': 4, '五': 3, '六': 4, '七': 1, '八': 1,
      '九': 3, '十': 2, '日': 4, '月': 4, '年': 2, '去': 4, '来': 2, '上': 4,
      '下': 4, '东': 1, '西': 1, '南': 2, '卫': 4, '喜': 3, '欢': 1, '米': 3,
      '饭': 4, '店': 4, '火': 3, '车': 1, '站': 4, '医': 1, '院': 4, '前': 2,
      '面': 4, '后': 4, '左': 3, '右': 4, '红': 2, '白': 2, '黑': 1, '快': 4,
      '慢': 4, '新': 1, '旧': 4, '开': 1, '关': 1, '坐': 4, '走': 3, '跑': 3,
      '运': 4, '动': 4, '运': 4, '身': 1, '体': 3, '健': 4, '康': 1, '心': 1,
      '文': 2, '字': 4, '汉': 4, '语': 3, '名': 2, '早': 3, '晚': 3, '午': 3,
      '晴': 2, '阴': 1, '雨': 3, '雪': 3, '风': 1, '热': 4, '冷': 3, '累': 4,
      '忙': 2, '闲': 2, '工作': 1, '爸': 4, '妈': 1, '哥': 1, '弟': 4, '姐': 3,
      '妹': 4, '儿': 2, '女': 3, '男': 2, '孩': 2, '子': 5, '眼': 3, '手': 3,
      '头': 2, '足': 2, '球': 2, '篮': 2, '菜': 4, '果': 3, '苹': 2, '鱼': 2,
      '肉': 4, '牛': 2, '奶': 3, '鸡': 1, '蛋': 4, '热': 4, '咖啡': 1
    };
    return toneMap;
  }

  var api = {
    STORAGE_KEY: STORAGE_KEY,
    load: load,
    add: add,
    remove: remove,
    getById: getById,
    splitSentences: splitSentences,
    toItems: toItems,
    guessPinyin: guessPinyin
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Custom = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
