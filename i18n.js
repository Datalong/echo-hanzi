/* i18n.js — 轻量国际化多语言引擎 (中 / EN)
 * 支持浏览器语言嗅探、翻译键值查找与动态替换
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'echo-hanzi:lang:v1';

  var TRANSLATIONS = {
    'zh-CN': {
      brand: 'Echo Hanzi',
      lblMode: '模式',
      lblLevel: '词库',
      lblStory: '选篇',
      lblCount: '数量',
      optWord: '词',
      optSentence: '句',
      optStory: '故事',
      optAll: '全部',
      btnTones: '声调',
      btnIme: '输入法',
      btnEcho: '听音',
      btnSpeech: '朗读',
      btnSound: '音效',
      unitWord: '词',
      unitSentence: '句',
      unitStory: '段',
      tagNewWord: '新词',
      tagNewSentence: '新句',
      tagReview: '复习',
      tagDue: '待复习',
      tagDrill: '弱项专项',
      btnReveal: '显示答案',
      statCpm: '字符/分',
      statAcc: '正确率',
      statStreak: '连击',
      statTime: '用时',
      focusHint: '点一下页面开始输入',
      hintTab: '换词',
      hintEsc: '重来',
      hintAns: '看答案',
      hintReplay: '重听发音',
      hintStroke: '笔顺',
      hintPunct: '句中标点用 , . ! ? 键',
      hintU: 'ü 可以打 v 或 u；空格会自动跳过',
      btnStats: '数据看板',
      resTitle: '本轮完成',
      resCpmUnit: '字符/分',
      resWords: '完成词数',
      resStreak: '最长连击',
      resNeedReview: '需要复习',
      btnAgain: '再练一轮',
      btnNewset: '换一批词',
      btnShareCard: '分享海报',
      btnViewDash: '看数据',
      shareTitle: '战绩海报',
      btnCopyPoster: '复制图片',
      btnDownloadPoster: '下载 PNG',
      msgCopied: '海报已复制到剪贴板！可以直接粘贴发推/分享',
      dashTitle: '数据看板',
      btnBackTyping: '返回练习',
      dashEmpty: '还没有练习记录，先跑一轮吧。',
      dashSessions: '练习轮数',
      dashSyllables: '累计音节',
      dashAvgCpm: '平均 CPM',
      dashAvgAcc: '平均正确率',
      dashSpeedTrend: '速度趋势',
      dashRecentTrend: '最近 14 轮 · 字符/分',
      dashLow: '最低',
      dashHigh: '最高',
      dashRecent: '最近',
      dashRounds: '轮',
      dashWeakInitials: '易错声母 / 韵母',
      dashWeakRankMeta: '按错误率排序 · 样本 ≥3',
      dashInitials: '声母',
      dashFinals: '韵母',
      dashToneRates: '声调错误率',
      dashToneMeta: '需开声调模式积累',
      dashTone1: '一声 ˉ',
      dashTone2: '二声 ˊ',
      dashTone3: '三声 ˇ',
      dashTone4: '四声 ˋ',
      dashTone5: '轻声',
      dashMastery: '掌握分布',
      dashMasteryMeta: '共 {total} 词句 · 间隔 ≥21 天记为已掌握',
      dashFresh: '未学',
      dashLearning: '学习中',
      dashSolid: '巩固中',
      dashMastered: '已掌握',
      btnResetStats: '清空统计数据',
      strokeStrokeCount: '共 {count} 画',
      strokeStepInfo: '{cur} / {total} 画',
      btnStrokeReplay: '重播',
      btnStrokePrev: '上一步',
      btnStrokeNext: '下一步',
      btnStrokePlay: '自动演示',
      imePagerHint: '- / = 翻页',
      dictCommonColloc: '常用搭配',
      dictRadicalPrefix: '部首 '
    },
    'en': {
      brand: 'Echo Hanzi',
      lblMode: 'Mode',
      lblLevel: 'Level',
      lblStory: 'Story',
      lblCount: 'Count',
      optWord: 'Words',
      optSentence: 'Sentences',
      optStory: 'Stories',
      optAll: 'All',
      btnTones: 'Tones',
      btnIme: 'IME',
      btnEcho: 'Echo',
      btnSpeech: 'Speak',
      btnSound: 'Sound',
      unitWord: 'words',
      unitSentence: 'sentences',
      unitStory: 'paragraphs',
      tagNewWord: 'New Word',
      tagNewSentence: 'New Sentence',
      tagReview: 'Review',
      tagDue: 'Due',
      tagDrill: 'Weak Drill',
      btnReveal: 'Show Answer',
      statCpm: 'CPM',
      statAcc: 'Accuracy',
      statStreak: 'Streak',
      statTime: 'Time',
      focusHint: 'Click anywhere to start typing',
      hintTab: 'Next',
      hintEsc: 'Restart',
      hintAns: 'Answer',
      hintReplay: 'Replay audio',
      hintStroke: 'Stroke order',
      hintPunct: 'Type punctuation with , . ! ?',
      hintU: 'Type ü with v or u; spaces are auto-skipped',
      btnStats: 'Dashboard',
      resTitle: 'Session Complete',
      resCpmUnit: 'CPM',
      resWords: 'Completed',
      resStreak: 'Best Streak',
      resNeedReview: 'Needs Review',
      btnAgain: 'Practice Again',
      btnNewset: 'New Words',
      btnShareCard: 'Share Card',
      btnViewDash: 'Dashboard',
      shareTitle: 'Achievement Card',
      btnCopyPoster: 'Copy Image',
      btnDownloadPoster: 'Download PNG',
      msgCopied: 'Card copied to clipboard! Paste directly to share.',
      dashTitle: 'Analytics Dashboard',
      btnBackTyping: 'Back to Practice',
      dashEmpty: 'No practice sessions yet. Finish a round first.',
      dashSessions: 'Sessions',
      dashSyllables: 'Syllables',
      dashAvgCpm: 'Avg CPM',
      dashAvgAcc: 'Avg Accuracy',
      dashSpeedTrend: 'Speed Trend',
      dashRecentTrend: 'Last 14 rounds · CPM',
      dashLow: 'Min',
      dashHigh: 'Max',
      dashRecent: 'Last',
      dashRounds: 'rounds',
      dashWeakInitials: 'Weak Initials & Finals',
      dashWeakRankMeta: 'Ranked by error rate · samples ≥ 3',
      dashInitials: 'Initials',
      dashFinals: 'Finals',
      dashToneRates: 'Tone Error Rates',
      dashToneMeta: 'Accumulated in Tone Mode',
      dashTone1: '1st Tone ˉ',
      dashTone2: '2nd Tone ˊ',
      dashTone3: '3rd Tone ˇ',
      dashTone4: '4th Tone ˋ',
      dashTone5: 'Neutral Tone',
      dashMastery: 'Mastery Breakdown',
      dashMasteryMeta: '{total} words & sentences · interval ≥ 21d = Mastered',
      dashFresh: 'Unseen',
      dashLearning: 'Learning',
      dashSolid: 'Reviewing',
      dashMastered: 'Mastered',
      btnResetStats: 'Clear All Data',
      strokeStrokeCount: '{count} strokes',
      strokeStepInfo: '{cur} / {total} strokes',
      btnStrokeReplay: 'Replay',
      btnStrokePrev: 'Previous',
      btnStrokeNext: 'Next',
      btnStrokePlay: 'Auto Demo',
      imePagerHint: '- / = page',
      dictCommonColloc: 'Collocations',
      dictRadicalPrefix: 'Radical '
    }
  };

  var currentLang = 'zh-CN';

  function detectLanguage() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'zh-CN' || saved === 'en')) return saved;
    } catch (e) {}

    // 根据系统语言自动嗅探
    var sysLang = (global.navigator && (navigator.language || navigator.userLanguage) || 'en').toLowerCase();
    if (sysLang.indexOf('zh') === 0) return 'zh-CN';
    return 'en';
  }

  function setLanguage(lang) {
    if (lang !== 'zh-CN' && lang !== 'en') return;
    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
  }

  function t(key, vars) {
    var dict = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    var str = dict[key] || TRANSLATIONS['en'][key] || key;
    if (vars && typeof vars === 'object') {
      for (var k in vars) {
        str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      }
    }
    return str;
  }

  function toggleLanguage() {
    setLanguage(currentLang === 'zh-CN' ? 'en' : 'zh-CN');
    return currentLang;
  }

  // 初始化
  currentLang = detectLanguage();

  var api = {
    STORAGE_KEY: STORAGE_KEY,
    getLang: function () { return currentLang; },
    setLanguage: setLanguage,
    toggleLanguage: toggleLanguage,
    t: t,
    TRANSLATIONS: TRANSLATIONS
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.I18n = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
