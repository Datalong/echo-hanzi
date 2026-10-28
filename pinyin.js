/* pinyin.js — 拼音解析（零依赖）
 *
 * 解决三件事：
 *  1. 带调拼音 -> 无调字母 + 声调数字：nǐ hǎo -> "ni hao" / "ni3 hao3"
 *  2. 连写多音节自动切分：huǒchēzhàn -> huo3 che1 zhan4
 *  3. 生成打字用的“可敲击单元”（字母位 + 声调位）
 */
(function (global) {
  'use strict';

  // 带调字母 -> [无调字母, 声调]
  var TONE_TABLE = {
    'ā': ['a', 1], 'á': ['a', 2], 'ǎ': ['a', 3], 'à': ['a', 4],
    'ē': ['e', 1], 'é': ['e', 2], 'ě': ['e', 3], 'è': ['e', 4],
    'ī': ['i', 1], 'í': ['i', 2], 'ǐ': ['i', 3], 'ì': ['i', 4],
    'ō': ['o', 1], 'ó': ['o', 2], 'ǒ': ['o', 3], 'ò': ['o', 4],
    'ū': ['u', 1], 'ú': ['u', 2], 'ǔ': ['u', 3], 'ù': ['u', 4],
    'ǖ': ['v', 1], 'ǘ': ['v', 2], 'ǚ': ['v', 3], 'ǜ': ['v', 4],
    'ü': ['v', 0],
    'ń': ['n', 2], 'ň': ['n', 3], 'ǹ': ['n', 4],
    'ḿ': ['m', 2],
    'ê': ['e', 0]
  };

  // 韵母表（按长度倒序匹配）—— ü 统一写作 v
  var FINALS = [
    'iang', 'iong', 'uang', 'ueng', 'veng',
    'ang', 'eng', 'ong', 'ian', 'iao', 'ing', 'uai', 'uan', 'van', 'uen', 'uei',
    'iou', 'a', 'o', 'e', 'i', 'u', 'v', 'ai', 'ei', 'ao', 'ou', 'an', 'en',
    'er', 'ia', 'ie', 'iu', 'in', 'ua', 'uo', 'ui', 'un', 'ue', 've', 'vn',
    'ng', 'm', 'n'
  ].sort(function (a, b) { return b.length - a.length; });

  var INITIALS = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l',
    'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w'];

  var SEPARATOR = /[\s'\u2019\u02bc]+/;

  /** 把一段带调文字拆成原子：[{ letter, tone, marked }] */
  function tokenize(token) {
    var atoms = [];
    for (var i = 0; i < token.length; i++) {
      var ch = token[i];
      var mapped = TONE_TABLE[ch];
      if (mapped) {
        atoms.push({ letter: mapped[0], tone: mapped[1], marked: mapped[1] > 0 });
      } else if (/[a-zA-Z]/.test(ch)) {
        atoms.push({ letter: ch.toLowerCase(), tone: 0, marked: false });
      }
      // 其它字符（标点、分隔符）忽略
    }
    return atoms;
  }

  /**
   * 把一串无调字母切成音节：['h','u','o','c','h','e','z','h','a','n']
   * -> ['huo', 'che', 'zhan']；带调原子作为约束：一个音节最多一个声调标记。
   */
  function segment(atoms) {
    var letters = atoms.map(function (a) { return a.letter; }).join('');
    var markedAt = [];
    var count = 0;
    atoms.forEach(function (a, i) {
      if (a.marked) { markedAt.push(i); count++; }
    });

    var memo = {};

    function markedIn(start, end) {
      var n = 0;
      for (var i = 0; i < markedAt.length; i++) {
        if (markedAt[i] >= start && markedAt[i] < end) n++;
      }
      return n;
    }

    function solve(pos) {
      if (pos === letters.length) return [];
      if (memo[pos] !== undefined) return memo[pos];

      // 可能的音节结尾位置：先试最长
      var candidates = [];
      for (var initialLength = 2; initialLength >= 0; initialLength--) {
        var initial = letters.substr(pos, initialLength);
        if (initialLength > 0 && INITIALS.indexOf(initial) === -1) continue;
        for (var f = 0; f < FINALS.length; f++) {
          var final = FINALS[f];
          var next = pos + initialLength + final.length;
          if (next > letters.length) continue;
          if (letters.substr(pos + initialLength, final.length) !== final) continue;
          candidates.push({ end: next, chunk: initial + final });
        }
      }
      // 长音节优先
      candidates.sort(function (a, b) { return b.chunk.length - a.chunk.length; });

      for (var c = 0; c < candidates.length; c++) {
        var cand = candidates[c];
        if (markedIn(pos, cand.end) > 1) continue;    // 一个音节只能有一个声调
        var rest = solve(cand.end);
        if (rest) {
          var result = [cand.chunk].concat(rest);
          memo[pos] = result;
          return result;
        }
      }
      memo[pos] = null;
      return null;
    }

    var chunks = solve(0);
    if (!chunks) chunks = [letters];  // 无法切分时整体当作一个音节

    // 给每个音节配上声调（atoms 与 letters 索引一一对应）
    var syllables = [];
    var cursor = 0;
    chunks.forEach(function (chunk) {
      var tone = 0;
      for (var i = cursor; i < cursor + chunk.length; i++) {
        if (atoms[i] && atoms[i].marked) { tone = atoms[i].tone; break; }
      }
      syllables.push({ letters: chunk, tone: tone });
      cursor += chunk.length;
    });

    return syllables;
  }

  /** 'nǐ hǎo' / 'nǚ\u2019ér' / 'huǒchēzhàn' -> [{letters:'nv',tone:3}, ...] */
  function parse(pinyin) {
    var tokens = String(pinyin || '').split(SEPARATOR).filter(Boolean);
    var out = [];
    tokens.forEach(function (token) {
      segment(tokenize(token)).forEach(function (s) { out.push(s); });
    });
    return out;
  }

  /** 退化为音节字符串数组（无调），便于展示分组 */
  function splitSyllables(pinyin) {
    return parse(pinyin).map(function (s) { return s.letters; });
  }

  /** 'huǒchēzhàn' -> 'huo che zhan' */
  function toPlain(pinyin) {
    return splitSyllables(pinyin).join(' ');
  }

  /** 'huǒchēzhàn' -> 'huo3 che1 zhan4'（轻声记 5） */
  function toNumbered(pinyin) {
    return parse(pinyin).map(function (s) {
      return s.letters + (s.tone === 0 ? 5 : s.tone);
    }).join(' ');
  }

  /** 单个音节 -> 打字单元（字母位 + 可选声调位），不带分组信息 */
  function cellsForSyllable(syllable, requireTone) {
    var cells = [];
    syllable.letters.split('').forEach(function (ch) {
      cells.push({
        ch: ch,
        // ü 允许打 v 或 u
        accepts: ch === 'v' ? ['v', 'u'] : [ch],
        kind: 'letter',
        ok: false,
        err: false
      });
    });
    if (requireTone) {
      var neutral = syllable.tone === 0;
      cells.push({
        ch: neutral ? '5' : String(syllable.tone),
        accepts: neutral ? ['5', '0'] : [String(syllable.tone)],
        kind: 'tone',
        ok: false,
        err: false
      });
    }
    return cells;
  }

  /** 生成打字单元，按音节分组（group = 音节序号） */
  function buildCells(pinyin, requireTone) {
    var cells = [];
    parse(pinyin).forEach(function (syllable, groupIndex) {
      cellsForSyllable(syllable, requireTone).forEach(function (cell) {
        cell.group = groupIndex;
        cells.push(cell);
      });
    });
    return cells;
  }

  /** 'zhang' -> { initial: 'zh', final: 'ang' }；零声母返回 initial: '' */
  function splitInitialFinal(letters) {
    var word = String(letters || '').toLowerCase();
    if (!word) return { initial: '', final: '' };
    var two = word.slice(0, 2);
    if (two === 'zh' || two === 'ch' || two === 'sh') {
      return { initial: two, final: word.slice(2) };
    }
    if ('bpmfdtnlgkhjqxrzcsyw'.indexOf(word.charAt(0)) !== -1) {
      return { initial: word.charAt(0), final: word.slice(1) };
    }
    return { initial: '', final: word };
  }

  var api = {
    parse: parse,
    splitInitialFinal: splitInitialFinal,
    splitSyllables: splitSyllables,
    toPlain: toPlain,
    toNumbered: toNumbered,
    cellsForSyllable: cellsForSyllable,
    buildCells: buildCells
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Pinyin = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
