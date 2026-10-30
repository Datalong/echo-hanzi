/* t9.js — 九键拼音键盘训练引擎
 *
 * 手机九键布局：2ABC 3DEF 4GHI 5JKL 6MNO 7PQRS 8TUV 9WXYZ。
 * 把词库全量预索引成「数字串 -> 词条」，按键时按前缀过滤候选，
 * 模拟真实九键输入的「按数字、挑候选」体验。
 */
(function (global) {
  'use strict';

  var KEY_LETTERS = {
    '2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl',
    '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'
  };

  var index = null;      // digitStr -> [词条]
  var indexKey = '';
  var sentIndex = null;  // 句库独立索引
  var sentIndexKey = '';

  function pinyinDigits(pinyin) {
    if (!global.Pinyin) return '';
    var plain = global.Pinyin.toNumbered(pinyin || '');
    var letters = plain.replace(/[0-9\s]/g, '').toLowerCase();
    var out = '';
    for (var i = 0; i < letters.length; i++) {
      var found = '';
      for (var k in KEY_LETTERS) {
        if (KEY_LETTERS[k].indexOf(letters[i]) !== -1) { found = k; break; }
      }
      if (!found) return ''; // 含无法映射字符（如 ü -> v? v 在 8 wxyz? v 不在键盘，跳过该词）
      out += found;
    }
    return out;
  }

  /** 构建索引（通用：词库或句库） */
  function buildIndex(pool) {
    var idx = {};
    pool.forEach(function (item) {
      var digits = pinyinDigits(item.pinyin);
      if (!digits) return;
      // 按前缀入桶；桶满则跳过该层，但继续填更长的前缀（长前缀更精确，不能漏）
      for (var l = 1; l <= digits.length; l++) {
        var pre = digits.slice(0, l);
        var bucket = idx[pre] || (idx[pre] = []);
        if (bucket.length < 60 && bucket.indexOf(item) === -1) bucket.push(item);
      }
    });
    return idx;
  }

  /** 构建全量词索引（词库变化时重新构建） */
  function ensureIndex() {
    var key = (global.WORD_LISTS && global.WORD_LISTS.all ? global.WORD_LISTS.all.length : 0) + '';
    if (index && indexKey === key) return index;
    index = buildIndex((global.WORD_LISTS && global.WORD_LISTS.all) || []);
    indexKey = key;
    return index;
  }

  /** 构建句库索引 */
  function ensureSentenceIndex() {
    var pool = (global.SENTENCE_LISTS && global.SENTENCE_LISTS.all) || [];
    var key = pool.length + '';
    if (sentIndex && sentIndexKey === key) return sentIndex;
    sentIndex = buildIndex(pool);
    sentIndexKey = key;
    return sentIndex;
  }

  /** 按已按的数字串取候选（kind: 'word' | 'sent'） */
  function candidates(digits, max, kind) {
    var idx = kind === 'sent' ? ensureSentenceIndex() : ensureIndex();
    var bucket = idx[digits] || [];
    var seen = {};
    var out = [];
    for (var i = 0; i < bucket.length && out.length < (max || 9); i++) {
      if (!seen[bucket[i].hanzi]) {
        seen[bucket[i].hanzi] = true;
        out.push(bucket[i]);
      }
    }
    return out;
  }

  /** 某个词的数字串（教学/校验用） */
  function digitsOf(item) {
    return item ? pinyinDigits(item.pinyin) : '';
  }

  var api = {
    KEY_LETTERS: KEY_LETTERS,
    pinyinDigits: pinyinDigits,
    ensureIndex: ensureIndex,
    candidates: candidates,
    digitsOf: digitsOf
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.T9 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
