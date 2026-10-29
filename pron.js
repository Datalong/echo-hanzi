/* pron.js — 发音最小对立专项 (Minimal Pairs)
 *
 * 用「只有一处不同」的字对训练听辨：
 *   四声对比：mā má mǎ mà
 *   声母对立：shì / sì、nǐ / lǐ、fēi / hē ...
 *   韵母对立：bān / bāng、xīn / xīng ...
 * 答错会写回 Stats 的音节桶，与弱项专项、AI 助教上下文联动。
 */
(function (global) {
  'use strict';

  /* ---------------- 数据 ---------------- */

  // 四声组：同一音节的四个声调字
  var TONE_SETS = [
    { syllable: 'ma', chars: ['妈', '麻', '马', '骂'], pinyins: ['mā', 'má', 'mǎ', 'mà'] },
    { syllable: 'ba', chars: ['八', '爸', '把', '罢'], pinyins: ['bā', 'bà', 'bǎ', 'ba'] },
    { syllable: 'yi', chars: ['一', '姨', '椅', '亿'], pinyins: ['yī', 'yí', 'yǐ', 'yì'] },
    { syllable: 'shi', chars: ['师', '十', '史', '是'], pinyins: ['shī', 'shí', 'shǐ', 'shì'] },
    { syllable: 'xi', chars: ['西', '席', '洗', '戏'], pinyins: ['xī', 'xí', 'xǐ', 'xì'] },
    { syllable: 'ban', chars: ['班', '掰', '板', '半'], pinyins: ['bān', 'bái', 'bǎn', 'bàn'] }
  ];

  // 声母对立组：成对的最小对立字
  var INITIAL_PAIRS = [
    { group: 'sh / s', items: [['是', 'shì'], ['四', 'sì']] },
    { group: 'zh / z', items: [['中', 'zhōng'], ['从', 'cóng']] },
    { group: 'ch / c', items: [['吃', 'chī'], ['次', 'cì']] },
    { group: 'n / l', items: [['你', 'nǐ'], ['里', 'lǐ']] },
    { group: 'f / h', items: [['飞', 'fēi'], ['喝', 'hē']] },
    { group: 'b / p', items: [['包', 'bāo'], ['抛', 'pāo']] },
    { group: 'd / t', items: [['度', 'dù'], ['兔', 'tù']] },
    { group: 'g / k', items: [['哥', 'gē'], ['课', 'kè']] }
  ];

  // 韵母对立组：前后鼻音 / 介音差异
  var FINAL_PAIRS = [
    { group: 'an / ang', items: [['班', 'bān'], ['帮', 'bāng']] },
    { group: 'en / eng', items: [['门', 'mén'], ['梦', 'mèng']] },
    { group: 'in / ing', items: [['心', 'xīn'], ['星', 'xīng']] },
    { group: 'ian / iang', items: [['面', 'miàn'], ['亮', 'liàng']] },
    { group: 'uan / uang', items: [['万', 'wàn'], ['望', 'wàng']] },
    { group: 'e / uo', items: [['车', 'chē'], ['桌', 'zhuō']] }
  ];

  var CATEGORIES = ['tone', 'initial', 'final'];

  /* ---------------- 出题 ---------------- */

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  /**
   * 出一题
   * @param {string} category 'tone' | 'initial' | 'final'
   * @returns {{category, answer:{hanzi,pinyin,letters,tone}, options:[{hanzi,pinyin,label}]}}
   */
  function nextRound(category) {
    if (category === 'tone') {
      var set = pick(TONE_SETS);
      var idx = Math.floor(Math.random() * 4);
      var answer = { hanzi: set.chars[idx], pinyin: set.pinyins[idx], letters: set.syllable, tone: idx + 1 };
      return {
        category: 'tone',
        answer: answer,
        options: set.chars.map(function (ch, i) {
          return { hanzi: ch, pinyin: set.pinyins[i], label: set.pinyins[i] };
        })
      };
    }

    var pool = category === 'initial' ? INITIAL_PAIRS : FINAL_PAIRS;
    var grp = pick(pool);
    var ansIdx = Math.floor(Math.random() * 2);
    var a = grp.items[ansIdx];
    var b = grp.items[1 - ansIdx];
    return {
      category: category,
      answer: {
        hanzi: a[0], pinyin: a[1],
        letters: (global.Pinyin ?
          global.Pinyin.toNumbered(a[1]).split(' ')[0].replace(/[0-9]/g, '') : a[1]),
        tone: parseInt(a[1].slice(-1), 10) || 5
      },
      options: [
        { hanzi: a[0], pinyin: a[1], label: a[1] },
        { hanzi: b[0], pinyin: b[1], label: b[1] }
      ]
    };
  }

  var api = {
    TONE_SETS: TONE_SETS,
    INITIAL_PAIRS: INITIAL_PAIRS,
    FINAL_PAIRS: FINAL_PAIRS,
    CATEGORIES: CATEGORIES,
    nextRound: nextRound
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Pron = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
