/* app.js — 打字引擎与界面逻辑（词模式 / 句模式） */
(function () {
  'use strict';

  var STORAGE_KEY = 'echo-hanzi:v1';
  var $ = function (id) { return document.getElementById(id); };

  // 汉字标点 -> 键盘键位（模拟真实中文输入法的标点键）
  var PUNCT_KEYS = {
    '，': ',', '。': '.', '！': '!', '？': '?', '：': ':',
    '；': ';', '、': ',', '“': '"', '”': '"'
  };
  var PUNCT_RE = /[，。！？：；、“”]/;

  var DEFAULTS = {
    mode: 'word',
    level: 'hsk1',
    storyId: 'beijing-trip',
    count: 20,
    tones: false,
    ime: false,
    echo: false,
    speech: true,
    sound: true,
    theme: 'dark'
  };

  var els = {
    mode: $('sel-mode'),
    level: $('sel-level'),
    count: $('sel-count'),
    story: $('sel-story'),
    fieldLevel: $('field-level'),
    fieldStory: $('field-story'),
    fieldCount: $('field-count'),
    storyView: $('story-view'),
    storyTitle: $('story-title'),
    storyIntro: $('story-intro'),
    storyParagraphs: $('story-paragraphs'),
    dictTooltip: $('dict-tooltip'),
    dtChar: $('dt-char'),
    dtPy: $('dt-py'),
    dtDef: $('dt-def'),
    dtRad: $('dt-rad'),
    dtRadDesc: $('dt-rad-desc'),
    dtCollocs: $('dt-collocs'),
    dtBtnSpeak: $('dt-btn-speak'),
    dtBtnStroke: $('dt-btn-stroke'),
    tones: $('tg-tones'),
    ime: $('tg-ime'),
    imePopup: $('ime-popup'),
    imeBuffer: $('ime-buffer'),
    imeCandidates: $('ime-candidates'),
    imePageInfo: $('ime-page-info'),
    echo: $('tg-echo'),
    speech: $('tg-speech'),
    sound: $('tg-sound'),
    theme: $('tg-theme'),
    tgLang: $('tg-lang'),
    progress: $('progress-fill'),
    runPos: $('run-pos'),
    runLevel: $('run-level'),
    runMode: $('run-mode'),
    runDue: $('run-due'),
    runDrill: $('run-drill'),
    dashDrills: $('dash-drills'),
    cardBadge: $('card-badge'),
    voiceWave: $('voice-wave'),
    rsDue: $('rs-due'),
    stats: $('screen-stats'),
    dashSummary: $('dash-summary'),
    dashTrend: $('dash-trend'),
    dashTrendSub: $('dash-trend-sub'),
    dashMasterySub: $('dash-mastery-sub'),
    dashErrors: $('dash-errors'),
    dashTones: $('dash-tones'),
    dashMastery: $('dash-mastery'),
    dashEmpty: $('dash-empty'),
    btnStats: $('btn-stats'),
    btnDashBack: $('btn-dash-back'),
    btnDashReset: $('btn-dash-reset'),
    btnDashFromResult: $('btn-dash-from-result'),
    strokeModal: $('stroke-modal'),
    strokeChar: $('stroke-char'),
    strokeInfo: $('stroke-info'),
    strokeCanvas: $('stroke-canvas'),
    btnStrokeClose: $('btn-stroke-close'),
    btnStrokeReplay: $('btn-stroke-replay'),
    btnStrokePrev: $('btn-stroke-prev'),
    btnStrokeNext: $('btn-stroke-next'),
    btnStrokePlay: $('btn-stroke-play'),
    btnShowStroke: $('btn-show-stroke'),
    card: $('card'),
    hanzi: $('hanzi'),
    pinyin: $('pinyin'),
    sentence: $('sentence'),
    english: $('english'),
    reveal: $('btn-reveal'),
    cpm: $('st-cpm'),
    acc: $('st-acc'),
    streak: $('st-streak'),
    time: $('st-time'),
    flash: $('flash'),
    typing: $('screen-typing'),
    result: $('screen-result'),
    rsCpm: $('rs-cpm'),
    rsAcc: $('rs-acc'),
    rsWords: $('rs-words'),
    rsStreak: $('rs-streak'),
    rsTime: $('rs-time'),
    review: $('review'),
    reviewList: $('review-list'),
    again: $('btn-again'),
    newset: $('btn-newset'),
    hintPunct: $('hint-punct'),
    focusHint: $('focus-hint'),
    catcher: $('catcher')
  };

  var settings = loadSettings();
  var state = {
    queue: [],
    index: 0,
    chars: [],       // [{ text, cells, start, end, punct }]
    cells: [],       // 扁平的打字单元
    cellEls: [],     // 与 cells 一一对应的 span
    charEls: [],     // 与 chars 一一对应的容器
    pos: 0,
    correctKeys: 0,
    errorKeys: 0,
    streak: 0,
    bestStreak: 0,
    startedAt: 0,
    finished: true,
    wordHadError: false,
    done: [],
    lock: false,
    dueCount: 0,
    reviewKeys: {},
    sessionId: 0,
    syllables: [],      // 本题的音节（含是否出错），用于统计
    statsOpen: false,
    drill: null,        // 当前专项：{ kind, key, label }
    strokeOpen: false,
    strokeIndex: 0,
    strokePaths: [],
    strokeTimer: null,
    imeBufferText: '',
    imePage: 0,
    imeList: [],
    dictTimer: null,
    dictChar: ''
  };
  var srsDb = window.Srs ? window.Srs.load() : {};
  var srsSaveTimer = null;
  var statsDb = window.Stats ? window.Stats.load() : null;
  var statsSaveTimer = null;
  var ticker = null;


  /* ---------------- 国际化翻译更新 ---------------- */

  function t(k, vars) {
    if (window.I18n && window.I18n.t) return window.I18n.t(k, vars);
    return k;
  }

  function applyTranslations() {
    if (!window.I18n) return;
    var lang = window.I18n.getLang();

    // 语言按钮文本：提示可切换到的目标语言
    if (els.tgLang) {
      els.tgLang.textContent = (lang === 'zh-CN' ? 'EN' : '中');
      els.tgLang.title = (lang === 'zh-CN' ? 'Switch to English' : '切换为中文');
    }

    // 顶栏 Label
    var q = function(id, text) { var el = $(id); if (el) el.textContent = text; };
    var labelEls = document.querySelectorAll('.sfield-label');
    if (labelEls.length >= 4) {
      labelEls[0].textContent = t('lblMode');
      labelEls[1].textContent = t('lblLevel');
      labelEls[2].textContent = t('lblStory');
      labelEls[3].textContent = t('lblCount');
    }

    // 模式下拉项
    if (els.mode && els.mode.options.length >= 3) {
      els.mode.options[0].textContent = t('optWord');
      els.mode.options[1].textContent = t('optSentence');
      els.mode.options[2].textContent = t('optStory');
    }
    // 数量下拉项
    if (els.count && els.count.options.length >= 4) {
      els.count.options[3].textContent = t('optAll');
    }

    // 顶栏开关
    if (els.tones) els.tones.textContent = t('btnTones');
    if (els.ime) els.ime.textContent = t('btnIme');
    if (els.echo) els.echo.textContent = t('btnEcho');
    if (els.speech) els.speech.textContent = t('btnSpeech');
    if (els.sound) els.sound.textContent = t('btnSound');

    // 揭示答案按钮
    if (els.reveal) els.reveal.textContent = t('btnReveal');

    // 统计条指标标签
    var statKs = document.querySelectorAll('.stats .stat-k');
    if (statKs.length >= 4) {
      statKs[0].textContent = t('statCpm');
      statKs[1].textContent = t('statAcc');
      statKs[2].textContent = t('statStreak');
      statKs[3].textContent = t('statTime');
    }

    // 焦点提示
    if (els.focusHint) els.focusHint.textContent = t('focusHint');

    // 成绩页面文案
    q('btn-again', t('btnAgain'));
    q('btn-newset', t('btnNewset'));
    q('btn-dash-from-result', t('btnViewDash'));
    var rsTitle = document.querySelector('.result-eyebrow');
    if (rsTitle) rsTitle.textContent = t('resTitle');
    var rsKs = document.querySelectorAll('.result-grid .stat-k');
    if (rsKs.length >= 4) {
      rsKs[0].textContent = t('statAcc');
      rsKs[1].textContent = t('resWords');
      rsKs[2].textContent = t('resStreak');
      rsKs[3].textContent = t('statTime');
    }
    var rvTitle = document.querySelector('.review-title');
    if (rvTitle) rvTitle.textContent = t('resNeedReview');

    // 看板页文案
    var dTitle = document.querySelector('.dash-title');
    if (dTitle) dTitle.textContent = t('dashTitle');
    q('btn-dash-back', t('btnBackTyping'));
    q('dash-empty', t('dashEmpty'));
    q('btn-dash-reset', t('btnResetStats'));

    // 页脚提示
    if (els.btnStats) els.btnStats.textContent = t('btnStats');

    // 刷新运行行与卡片角标
    updateRunLine();
    var cur = currentItem();
    if (cur) {
      var isReview = !!state.reviewKeys[window.Srs ? window.Srs.keyOf(cur) : ''];
      if (els.cardBadge) {
        els.cardBadge.textContent = isReview ? t('tagReview') : (isSentenceMode() ? t('tagNewSentence') : t('tagNewWord'));
      }
    }
    if (state.statsOpen) renderDashboard();
  }

  /* ---------------- 设置 ---------------- */

  function loadSettings() {
    var saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
    } catch (err) {
      saved = {};
    }
    return Object.assign({}, DEFAULTS, saved);
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (err) { /* 隐私模式下忽略 */ }
  }

  function isSentenceMode() {
    return settings.mode === 'sentence' || settings.mode === 'story';
  }

  function isStoryMode() {
    return settings.mode === 'story';
  }

  function applySettingsToUI() {
    els.mode.value = settings.mode;
    els.level.value = settings.level;
    if (els.story) els.story.value = settings.storyId || 'beijing-trip';
    els.count.value = String(settings.count);
    syncModeDropdowns();
    setPressed(els.tones, settings.tones);
    setPressed(els.ime, settings.ime);
    setPressed(els.echo, settings.echo);
    setPressed(els.speech, settings.speech);
    setPressed(els.sound, settings.sound);
    document.documentElement.setAttribute('data-theme', settings.theme);
  }

  function setPressed(btn, on) {
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  /* ---------------- 题组 ---------------- */

  function shuffle(list) {
    var arr = list.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function poolFor() {
    var table = isSentenceMode() ? window.SENTENCE_LISTS : window.WORD_LISTS;
    return (table[settings.level] || table.hsk1).slice();
  }



  /* ---------------- 悬浮即时微词典 ---------------- */

  function hideDictTooltip() {
    clearTimeout(state.dictTimer);
    if (els.dictTooltip) els.dictTooltip.hidden = true;
    state.dictChar = '';
  }

  function showDictTooltip(ch, anchorEl) {
    if (!window.Dict || !els.dictTooltip || !ch) return;
    var cur = currentItem();
    var info = window.Dict.lookup(ch, cur ? cur.pinyin : '');
    if (!info) return;

    state.dictChar = info.char;
    els.dtChar.textContent = info.char;
    els.dtPy.textContent = info.pinyin;
    els.dtDef.textContent = info.definition;
    els.dtRad.textContent = '部首 ' + info.radical;
    els.dtRadDesc.textContent = info.radicalMeaning;

    els.dtCollocs.textContent = '';
    (info.collocations || []).forEach(function (c) {
      var tag = span('dict-colloc-tag', c);
      els.dtCollocs.appendChild(tag);
    });

    // 锚定位置计算
    if (anchorEl) {
      var rect = anchorEl.getBoundingClientRect();
      var cardRect = els.card.getBoundingClientRect();
      var topPos = rect.bottom - cardRect.top + 8;
      var leftPos = rect.left - cardRect.left + (rect.width / 2) - 135; // 居中

      // 边界限制
      if (leftPos < 10) leftPos = 10;
      if (leftPos + 270 > cardRect.width - 10) leftPos = cardRect.width - 280;

      els.dictTooltip.style.top = topPos + 'px';
      els.dictTooltip.style.left = leftPos + 'px';
    }

    els.dictTooltip.hidden = false;
  }

  function setupDictHover(el, getCharFn) {
    if (!el) return;
    el.addEventListener('mouseenter', function (e) {
      clearTimeout(state.dictTimer);
      state.dictTimer = setTimeout(function () {
        var ch = typeof getCharFn === 'function' ? getCharFn(el) : el.textContent.trim();
        showDictTooltip(ch, el);
      }, 250);
    });

    el.addEventListener('mouseleave', function () {
      clearTimeout(state.dictTimer);
      state.dictTimer = setTimeout(function () {
        hideDictTooltip();
      }, 350);
    });

    el.addEventListener('click', function (e) {
      e.stopPropagation();
      var ch = typeof getCharFn === 'function' ? getCharFn(el) : el.textContent.trim();
      showDictTooltip(ch, el);
    });
  }

  /* ---------------- 笔顺演示 ---------------- */

  function getCurrentChar() {
    var item = currentItem();
    if (!item) return '文';
    if (!isSentenceMode()) {
      return item.hanzi.charAt(0) || '文';
    }
    // 句模式：根据当前正在打的字符定位
    for (var i = 0; i < state.chars.length; i++) {
      var c = state.chars[i];
      if (!c.punct && state.pos >= c.start && state.pos < c.end) {
        return c.text;
      }
    }
    // 如果都打完了或当前是标点，取第一个非标点汉字
    for (var j = 0; j < state.chars.length; j++) {
      if (!state.chars[j].punct) return state.chars[j].text;
    }
    return item.hanzi.charAt(0) || '文';
  }

  function openStrokeModal(charToDemo) {
    if (!window.Strokes || !els.strokeModal) return;
    var ch = charToDemo || getCurrentChar();
    state.strokeOpen = true;
    state.strokeIndex = 0;
    if (state.strokeTimer) clearInterval(state.strokeTimer);

    els.strokeChar.textContent = ch;
    var paths = window.Strokes.getStrokes(ch);
    state.strokePaths = paths;

    els.strokeInfo.textContent = '共 ' + paths.length + ' 画';
    renderStrokeCanvas();

    els.strokeModal.hidden = false;
    if (document.activeElement === els.catcher) els.catcher.blur();

    // 默认打开立即自动演示一遍
    playStrokeAnimation();
  }

  function closeStrokeModal() {
    state.strokeOpen = false;
    if (state.strokeTimer) { clearInterval(state.strokeTimer); state.strokeTimer = null; }
    if (els.strokeModal) els.strokeModal.hidden = true;
    if (!state.statsOpen && !state.finished) {
      focusCatcher();
    }
  }

  function renderStrokeCanvas() {
    if (!els.strokeCanvas) return;
    els.strokeCanvas.textContent = '';
    var paths = state.strokePaths;
    for (var i = 0; i < paths.length; i++) {
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', paths[i]);
      var cls = 'stroke-path';
      if (i < state.strokeIndex) cls += ' is-written';
      if (i === state.strokeIndex) cls += ' is-active';
      p.setAttribute('class', cls);
      els.strokeCanvas.appendChild(p);
    }
    var current = Math.min(paths.length, state.strokeIndex + 1);
    els.strokeInfo.textContent = current + ' / ' + paths.length + ' 画';
  }

  function playStrokeAnimation() {
    if (state.strokeTimer) clearInterval(state.strokeTimer);
    state.strokeIndex = 0;
    renderStrokeCanvas();
    if (settings.sound) window.Sound.click();

    state.strokeTimer = setInterval(function () {
      if (!state.strokeOpen) {
        clearInterval(state.strokeTimer);
        return;
      }
      state.strokeIndex++;
      if (state.strokeIndex >= state.strokePaths.length) {
        clearInterval(state.strokeTimer);
        state.strokeTimer = null;
        // 演示完成稍微强调全部
        setTimeout(function () {
          if (!state.strokeOpen) return;
          state.strokeIndex = state.strokePaths.length;
          renderStrokeCanvas();
          if (settings.sound) window.Sound.success();
        }, 150);
        return;
      }
      renderStrokeCanvas();
      if (settings.sound) window.Sound.click();
    }, 450);
  }

  function strokeStep(delta) {
    if (state.strokeTimer) { clearInterval(state.strokeTimer); state.strokeTimer = null; }
    var next = state.strokeIndex + delta;
    if (next < 0) next = 0;
    if (next >= state.strokePaths.length) next = state.strokePaths.length - 1;
    state.strokeIndex = next;
    renderStrokeCanvas();
    if (settings.sound) window.Sound.click();
  }

  /* ---------------- 弱点专项 ---------------- */

  function syllableFacts(syl) {
    var parts = window.Pinyin.splitInitialFinal(syl.letters);
    return {
      initial: parts.initial || '(零声母)',
      final: parts.final || syl.letters,
      tone: String(syl.tone || 5)
    };
  }

  function drillHit(one, item) {
    var syls = window.Pinyin.parse(item.pinyin);
    for (var i = 0; i < syls.length; i++) {
      var facts = syllableFacts(syls[i]);
      if (one.kind === 'tone' && facts.tone === one.key) return true;
      if (one.kind === 'initial' && facts.initial === one.key) return true;
      if (one.kind === 'final' && facts.final === one.key) return true;
    }
    return false;
  }

  function drillMatch(drill, item) {
    if (!drill) return true;
    if (drill.kind === 'mix') {
      return drill.keys.some(function (one) { return drillHit(one, item); });
    }
    return drillHit(drill, item);
  }

  function drillPool() {
    var pool = poolFor();
    if (!state.drill) return pool;
    var matched = pool.filter(function (item) { return drillMatch(state.drill, item); });
    return matched.length ? matched : pool;
  }

  function labelOf(kind, key) {
    if (kind === 'initial') return '声母 ' + key;
    if (kind === 'final') return '韵母 ' + key;
    if (kind === 'tone') return '第 ' + key + ' 声';
    return '弱点混合';
  }

  /** 从统计里挑出最该补的几项 */
  function buildSuggestions(limit) {
    if (!window.Stats) return [];
    var cands = [];

    window.Stats.rank(statsDb.initials, 5).forEach(function (r) {
      if (r.rate >= 0.12 && r.errors >= 3) {
        cands.push({ kind: 'initial', key: r.key, label: labelOf('initial', r.key), rate: r.rate, errors: r.errors, attempts: r.attempts });
      }
    });
    window.Stats.rank(statsDb.finals, 5).forEach(function (r) {
      if (r.rate >= 0.12 && r.errors >= 3) {
        cands.push({ kind: 'final', key: r.key, label: labelOf('final', r.key), rate: r.rate, errors: r.errors, attempts: r.attempts });
      }
    });
    ['3', '2', '4', '1', '5'].forEach(function (t) {
      var rec = statsDb.tones[t];
      if (rec && rec.a >= 5 && rec.e / rec.a >= 0.12) {
        cands.push({ kind: 'tone', key: t, label: labelOf('tone', t), rate: rec.e / rec.a, errors: rec.e, attempts: rec.a });
      }
    });

    cands.sort(function (a, b) { return b.rate - a.rate; });
    var top = cands.slice(0, limit || 3);

    // 两项以上时给一个「混合」入口
    if (top.length >= 2) {
      top.unshift({
        kind: 'mix',
        keys: top.slice(0, 3).map(function (c) { return { kind: c.kind, key: c.key }; }),
        label: '弱点混合',
        rate: top[0].rate,
        mixed: true
      });
    }
    return top;
  }

  function drillSize(drill) {
    if (!drill) return 0;
    return poolFor().filter(function (item) { return drillMatch(drill, item); }).length;
  }

  function startDrill(drill) {
    if (!drill) return;
    var size = drillSize(drill);
    if (!size) {
      flash('没有匹配的题目，换一个专项试试', 'bad');
      return;
    }
    state.drill = drill;
    if (drill.kind === 'tone' && !settings.tones) {
      settings.tones = true;                 // 练声调必须开声调模式
      setPressed(els.tones, true);
      saveSettings();
      flash('已自动打开声调模式', 'good');
    }
    if (els.stats) els.stats.hidden = true;
    state.statsOpen = false;
    startSession();
  }

  function exitDrill() {
    state.drill = null;
    startSession();
  }

  /** 到期题目优先，其余随机补齐；同时记录“本轮哪些是复习” */

  function syncModeDropdowns() {
    var story = isStoryMode();
    if (els.fieldStory) els.fieldStory.hidden = !story;
    if (els.fieldLevel) els.fieldLevel.hidden = story;
    if (els.fieldCount) els.fieldCount.hidden = story;
  }

  function buildQueue() {
    if (isStoryMode() && window.Stories) {
      var st = window.Stories.getById(settings.storyId);
      var storyQueue = [];
      st.sentences.forEach(function (s, idx) {
        storyQueue.push({
          hanzi: s.hanzi,
          pinyin: s.pinyin,
          english: s.english,
          level: st.level,
          kind: 'sentence',
          isStory: true,
          storyTitle: st.title,
          storyIntro: st.englishTitle + ' · ' + st.intro,
          lineIndex: idx,
          totalLines: st.sentences.length
        });
      });
      return storyQueue;
    }
    var pool = drillPool();
    var wanted = settings.count > 0 ? settings.count : pool.length;
    var due = window.Srs ? window.Srs.dueItems(srsDb, pool) : [];

    var out = [];
    var reviewKeys = {};
    state.dueCount = due.length;

    due.slice(0, wanted).forEach(function (entry) {
      out.push(entry.item);
      reviewKeys[window.Srs.keyOf(entry.item)] = true;
    });

    if (out.length < wanted) {
      var fresh = pool.filter(function (item) {
        return !(window.Srs && srsDb[window.Srs.keyOf(item)]);
      });
      var pool2 = fresh.length ? fresh : pool.slice();
      var guard = 0;
      while (out.length < wanted && guard++ < 500) {
        var batch = shuffle(pool2);
        for (var i = 0; i < batch.length && out.length < wanted; i++) {
          var last = out[out.length - 1];
          if (last && batch[i].hanzi === last.hanzi && batch.length > 1) {
            batch.push(batch.splice(i, 1)[0]);
            i--;
            continue;
          }
          out.push(batch[i]);
        }
      }
    }

    state.reviewKeys = reviewKeys;
    return out;
  }

  /* ---------------- 构建一题的打字单元 ---------------- */

  function punctCell(key) {
    return { ch: key, accepts: [key], kind: 'punct', ok: false, err: false };
  }

  /** 把 [汉字, 拼音] 拆成逐字单元：句模式下每个汉字一组 */
  function buildItem(item) {
    var tones = settings.tones;
    var chars = [];
    var flat = [];

    var syllables = [];

    if (!isSentenceMode()) {
      var parsed = window.Pinyin.parse(item.pinyin);
      parsed.forEach(function (syl) {
        var cellList = window.Pinyin.cellsForSyllable(syl, tones);
        var info = { letters: syl.letters, tone: syl.tone, hadError: false };
        cellList.forEach(function (cell) {
          cell.charIndex = 0;
          cell.syl = info;
          flat.push(cell);
        });
        syllables.push(info);
      });
      chars.push({ text: item.hanzi, cells: flat.slice(), start: 0, end: flat.length, punct: false });
      return { chars: chars, cells: flat, syllables: syllables };
    }

    // 句模式：先分离音节与标点键位，再逐字配对
    var syllableTokens = [];
    var punctKeys = [];
    item.pinyin
      .split(/([，。！？：；、,.!?;:]+)/)
      .filter(function (piece) { return piece.trim().length > 0; })
      .forEach(function (piece) {
        if (/^[，。！？：；、,.!?;:]+$/.test(piece)) {
          Array.from(piece).forEach(function (mark) { punctKeys.push(PUNCT_KEYS[mark] || mark); });
        } else {
          window.Pinyin.parse(piece).forEach(function (syl) { syllableTokens.push(syl); });
        }
      });

    var si = 0;
    var pi = 0;
    Array.from(item.hanzi).forEach(function (ch) {
      var start = flat.length;
      var isPunct = PUNCT_RE.test(ch);
      var cells;
      var token = null;

      if (isPunct) {
        cells = [punctCell(punctKeys[pi++] || PUNCT_KEYS[ch] || ch)];
      } else {
        token = syllableTokens[si++] || null;
        cells = token ? window.Pinyin.cellsForSyllable(token, tones) : [];
      }

      var charIndex = chars.length;
      var info = null;
      if (token) {
        info = { letters: token.letters, tone: token.tone, hadError: false };
        syllables.push(info);
      }

      cells.forEach(function (cell, k) {
        cell.charIndex = charIndex;
        cell.group = k;
        if (info) cell.syl = info;
        flat.push(cell);
      });
      chars.push({
        text: ch,
        cells: cells,
        start: start,
        end: flat.length,
        punct: isPunct
      });
    });

    return { chars: chars, cells: flat, syllables: syllables };
  }

  /* ---------------- DOM 构建（每题只构建一次） ---------------- */

  function span(className, text) {
    var el = document.createElement('span');
    el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function buildDom() {
    state.cellEls = [];
    state.charEls = [];
    state.chars.forEach(function (ch) {
      if (isSentenceMode()) {
        var unit = span('unit' + (ch.punct ? ' is-punct' : ''));
        var hz = span('u-hz', ch.text);
        if (!ch.punct) setupDictHover(hz);
        var py = span('u-py');
        ch.cells.forEach(function (cell, i) {
          var el = span('ch');
          el.textContent = cell.ch;
          py.appendChild(el);
          state.cellEls[ch.start + i] = el;
        });
        unit.appendChild(hz);
        unit.appendChild(py);
        els.sentence.appendChild(unit);
        state.charEls.push(unit);
      } else {
        var group = span('syl');
        ch.cells.forEach(function (cell, i) {
          var el = span('ch');
          el.textContent = cell.ch;
          group.appendChild(el);
          state.cellEls[ch.start + i] = el;
        });
        els.pinyin.appendChild(group);
        state.charEls.push(els.hanzi);
      }
    });
  }

  /* ---------------- 渲染与刷新 ---------------- */

  function currentItem() {
    return state.queue[state.index];
  }

  function renderItem() {
    var item = currentItem();
    if (!item) return;

    var built = buildItem(item);
    state.chars = built.chars;
    state.cells = built.cells;
    state.syllables = built.syllables || [];
    state.pos = 0;
    state.wordHadError = false;
    state.lock = false;

    els.sentence.textContent = '';
    els.pinyin.textContent = '';
    els.hanzi.textContent = item.hanzi;
    els.english.textContent = item.english;

    els.card.classList.remove('done', 'masked');
    els.card.classList.toggle('is-sentence', isSentenceMode());

    if (isStoryMode()) {
      els.card.classList.add('is-story');
      els.storyView.hidden = false;
      els.storyTitle.textContent = item.storyTitle || '';
      els.storyIntro.textContent = item.storyIntro || '';
      renderStoryParagraphs();
    } else {
      els.card.classList.remove('is-story');
      if (els.storyView) els.storyView.hidden = true;
    }

    els.hanzi.hidden = isSentenceMode();
    els.pinyin.hidden = isSentenceMode();
    els.sentence.hidden = !isSentenceMode();

    buildDom();

    var isReview = !!state.reviewKeys[window.Srs ? window.Srs.keyOf(item) : ''];
    if (els.cardBadge) {
      els.cardBadge.textContent = isReview ? t('tagReview') : (isSentenceMode() ? t('tagNewSentence') : t('tagNewWord'));
      els.cardBadge.className = 'card-badge' + (isReview ? ' is-review' : '');
      els.cardBadge.hidden = false;
    }

    els.reveal.hidden = !settings.echo;
    if (els.hintPunct) els.hintPunct.hidden = !isSentenceMode();
    if (settings.echo) {
      els.card.classList.add('masked');
      speak(item.hanzi);
    }

    paint();
    updateRunLine();
    updateStats();

    // 词模式大字挂载词典
    if (!isSentenceMode() && els.hanzi) {
      setupDictHover(els.hanzi, function () { return getCurrentChar(); });
    }

  }

  function paint() {
    state.cells.forEach(function (cell, i) {
      var el = state.cellEls[i];
      if (!el) return;
      var cls = 'ch';
      if (cell.kind === 'tone') cls += ' is-tone';
      if (cell.kind === 'punct') cls += ' is-punctkey';
      if (cell.ok) cls += ' is-ok';
      if (cell.err) cls += ' is-err';
      if (i === state.pos && !state.lock) cls += ' is-cur';
      if (el.className !== cls) el.className = cls;
    });

    state.chars.forEach(function (ch, i) {
      var el = state.charEls[i];
      if (!el) return;
      var done = ch.end > ch.start && state.pos >= ch.end;
      var current = !done && state.pos >= ch.start && state.pos < ch.end && !state.lock;
      el.classList.toggle('is-done', done);
      el.classList.toggle('is-cur', current);
    });
  }

  function runUnit() {
    if (isStoryMode()) return t('unitStory');
    return isSentenceMode() ? t('unitSentence') : t('unitWord');
  }


  function renderStoryParagraphs() {
    if (!els.storyParagraphs || !isStoryMode()) return;
    els.storyParagraphs.textContent = '';
    state.queue.forEach(function (it, idx) {
      var line = document.createElement('div');
      line.className = 'story-line';
      if (idx < state.index) line.className += ' is-done';
      if (idx === state.index) line.className += ' is-active';

      var hz = span('story-line-hz', it.hanzi);
      var en = span('story-line-en', it.english);
      line.appendChild(hz);
      line.appendChild(en);

      els.storyParagraphs.appendChild(line);
    });
  }

  function updateRunLine() {
    var total = state.queue.length;
    var item = currentItem();
    els.runPos.textContent = Math.min(state.index + 1, total) + ' / ' + total + ' ' + runUnit();
    els.runLevel.textContent = item ? item.level : settings.level.toUpperCase();
    var modes = [];
    if (settings.ime) modes.push(t('btnIme'));
    if (settings.tones) modes.push(t('btnTones'));
    if (settings.echo) modes.push(t('btnEcho'));
    if (isStoryMode()) modes.push(t('optStory'));
    else if (isSentenceMode()) modes.push(t('optSentence'));
    els.runMode.textContent = modes.join(' · ');

    if (els.runDrill) {
      var tips = state.drill ? null : buildSuggestions(1);
      if (state.drill) {
        els.runDrill.textContent = '专项：' + state.drill.label + ' ×';
        els.runDrill.title = '点击退出专项，回到普通练习';
        els.runDrill.classList.add('is-active');
        els.runDrill.hidden = false;
      } else if (tips.length) {
        els.runDrill.textContent = '弱项专项';
        els.runDrill.title = '按当前最弱的一项出题：' + tips[0].label;
        els.runDrill.classList.remove('is-active');
        els.runDrill.hidden = false;
      } else {
        els.runDrill.hidden = true;
      }
    }

    if (els.runDue) {
      if (state.dueCount > 0) {
        els.runDue.textContent = t('tagDue') + ' ' + state.dueCount;
        els.runDue.hidden = false;
      } else {
        els.runDue.hidden = true;
      }
    }

    var within = state.cells.length ? state.pos / state.cells.length : 0;
    var ratio = total ? (state.index + within) / total : 0;
    els.progress.style.width = (ratio * 100).toFixed(2) + '%';
  }

  function formatTime(ms) {
    var total = Math.max(0, Math.round(ms / 1000));
    var m = Math.floor(total / 60);
    var s = total % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function elapsed() {
    return state.startedAt ? Date.now() - state.startedAt : 0;
  }

  function accuracy() {
    var total = state.correctKeys + state.errorKeys;
    if (!total) return 100;
    return Math.round((state.correctKeys / total) * 100);
  }

  function cpm() {
    var ms = elapsed();
    if (!ms) return 0;
    return Math.round((state.correctKeys / ms) * 60000);
  }

  function updateStats() {
    els.cpm.textContent = String(cpm());
    els.acc.textContent = accuracy() + '%';
    els.streak.textContent = String(state.streak);
    els.time.textContent = formatTime(elapsed());
  }

  /* ---------------- 语音 / 音效 ---------------- */

  function speak(text) {
    if (!settings.speech) return;
    var rate = isStoryMode() ? 0.86 : (isSentenceMode() ? 0.82 : 0.84);
    window.Speech.speak(text, rate);
    if (els.speech) {
      els.speech.title = '语音已开启 (当前音色: ' + window.Speech.getVoiceName() + ') · 按 R 重播';
    }
  }

  function playClick() {
    if (settings.sound) window.Sound.click();
  }


  /* ---------------- 真实输入法 (IME) 核心 ---------------- */

  var IME_PAGE_SIZE = 5;

  function closeImePopup() {
    state.imeBufferText = '';
    state.imePage = 0;
    state.imeList = [];
    if (els.imePopup) els.imePopup.hidden = true;
  }

  function getTargetCharForIme() {
    var item = currentItem();
    if (!item) return '';
    if (!isSentenceMode()) {
      return item.hanzi;
    }
    for (var i = 0; i < state.chars.length; i++) {
      var c = state.chars[i];
      if (!c.punct && state.pos >= c.start && state.pos < c.end) {
        return c.text;
      }
    }
    return '';
  }

  function renderImePopup() {
    if (!els.imePopup || !settings.ime) return;
    if (!state.imeBufferText) {
      els.imePopup.hidden = true;
      return;
    }

    var target = getTargetCharForIme();
    var list = window.Ime.queryCandidates(state.imeBufferText, target);
    state.imeList = list;

    var totalPages = Math.max(1, Math.ceil(list.length / IME_PAGE_SIZE));
    if (state.imePage >= totalPages) state.imePage = totalPages - 1;
    if (state.imePage < 0) state.imePage = 0;

    var start = state.imePage * IME_PAGE_SIZE;
    var pageItems = list.slice(start, start + IME_PAGE_SIZE);

    els.imeBuffer.textContent = state.imeBufferText;
    els.imeCandidates.textContent = '';

    pageItems.forEach(function (cand, idx) {
      var item = document.createElement('span');
      item.className = 'ime-cand-item' + (idx === 0 ? ' is-first' : '');

      var num = span('ime-cand-num', (idx + 1) + '.');
      var txt = span('ime-cand-text', cand);
      item.appendChild(num);
      item.appendChild(txt);

      item.addEventListener('click', function () {
        chooseImeCandidate(cand);
      });
      els.imeCandidates.appendChild(item);
    });

    els.imePageInfo.textContent = (state.imePage + 1) + '/' + totalPages;
    els.imePopup.hidden = false;
  }

  function chooseImeCandidate(cand) {
    if (!cand) return;
    var target = getTargetCharForIme();
    var isCorrect = (cand === target);

    if (isCorrect) {
      // 正确上屏：推进当前字/词的所有 cell
      state.correctKeys++;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      playClick();

      // 将对应字所有的 cell 标记为 ok
      if (!isSentenceMode()) {
        state.cells.forEach(function (c) { c.ok = true; });
        state.pos = state.cells.length;
        completeItem();
      } else {
        // 句模式：找到当前字对应的所有 cells 标记为 ok，并推进 pos
        var curChar = null;
        for (var i = 0; i < state.chars.length; i++) {
          var c = state.chars[i];
          if (!c.punct && state.pos >= c.start && state.pos < c.end) {
            curChar = c;
            break;
          }
        }
        if (curChar) {
          for (var j = curChar.start; j < curChar.end; j++) {
            state.cells[j].ok = true;
          }
          state.pos = curChar.end;
          paint();
          updateRunLine();
          // 如果下一个是标点，不自动跳过，等待用户敲击真实标点键
          if (state.pos >= state.cells.length) {
            completeItem();
          }
        }
      }
    } else {
      // 选错候选词（同音字辨析失败）
      state.errorKeys++;
      state.wordHadError = true;
      state.streak = 0;
      if (settings.sound) window.Sound.error();

      var cell = state.cells[state.pos];
      if (cell) {
        cell.err = true;
        paint();
        setTimeout(function () {
          cell.err = false;
          paint();
        }, 220);
      }
    }

    closeImePopup();
    hideDictTooltip();
    updateStats();
  }

  /* ---------------- 打字输入 ---------------- */

  function persistSrs(immediate) {
    if (!window.Srs) return;
    clearTimeout(srsSaveTimer);
    if (immediate) {
      window.Srs.save(srsDb);
      return;
    }
    srsSaveTimer = setTimeout(function () { window.Srs.save(srsDb); }, 800);
  }

  function flash(message, kind) {
    if (!els.flash) return;
    els.flash.textContent = message;
    els.flash.className = 'flash' + (kind ? ' is-' + kind : '');
    clearTimeout(flash._timer);
    flash._timer = setTimeout(function () { els.flash.textContent = ''; }, 1600);
  }

  function persistStats(immediate) {
    if (!window.Stats) return;
    clearTimeout(statsSaveTimer);
    if (immediate) {
      window.Stats.save(statsDb);
      return;
    }
    statsSaveTimer = setTimeout(function () { window.Stats.save(statsDb); }, 800);
  }

  function ensureStarted() {
    if (state.startedAt || state.finished) return;
    state.startedAt = Date.now();
    if (!ticker) ticker = setInterval(updateStats, 200);
  }

  function handleChar(raw) {
    hideDictTooltip();
    if (state.finished || state.lock || state.statsOpen || state.strokeOpen) return;

    var ch = String(raw).toLowerCase();

    // 句模式下的标点按键直接响应上屏
    if (isSentenceMode() && PUNCT_RE.test(state.chars[state.pos] ? state.chars[state.pos].text : '')) {
      // 标点处理
    }

    // 真实输入法模式
    if (settings.ime) {
      if (/^[a-z]$/.test(ch)) {
        ensureStarted();
        state.imeBufferText += ch;
        renderImePopup();
        playClick();
        return;
      }
    }

    if (ch === ' ' || ch === "'" || ch === '\u2019') return;  // 空格/分隔符跳过
    if (/^\d$/.test(ch)) {
      if (!settings.tones) return;                             // 未开声调模式忽略数字
    } else if (!/^[a-zü,.;:!?"]$/.test(ch)) {
      return;
    }

    ensureStarted();

    var cell = state.cells[state.pos];
    if (!cell) return;

    if (cell.accepts.indexOf(ch) !== -1) {
      cell.ok = true;
      state.correctKeys++;
      state.pos++;
      playClick();
      paint();
      updateRunLine();
      if (state.pos >= state.cells.length) completeItem();
    } else {
      state.errorKeys++;
      state.wordHadError = true;
      state.streak = 0;
      cell.err = true;
      if (cell.syl) cell.syl.hadError = true;
      if (settings.sound) window.Sound.error();
      paint();
      setTimeout(function () {
        cell.err = false;
        paint();
      }, 220);
    }
    updateStats();
  }

  function handleBackspace() {
    if (state.finished || state.lock || state.pos === 0) return;
    state.pos--;
    state.cells[state.pos].ok = false;
    state.cells[state.pos].err = false;
    paint();
    updateRunLine();
  }

  function completeItem() {
    var item = currentItem();
    state.streak++;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.done.push({ item: item, errors: state.wordHadError });
    state.lock = true;

    if (window.Srs) {
      window.Srs.schedule(srsDb, item, !state.wordHadError);
      persistSrs();
    }
    if (window.Stats && state.syllables.length) {
      window.Stats.recordSyllables(statsDb, state.syllables);
      persistStats();
    }

    if (settings.sound) window.Sound.success();
    speak(item.hanzi);
    els.card.classList.add('done');
    els.card.classList.remove('masked');
    els.reveal.hidden = true;
    paint();
    updateRunLine();
    updateStats();

    // 词模式大字挂载词典
    if (!isSentenceMode() && els.hanzi) {
      setupDictHover(els.hanzi, function () { return getCurrentChar(); });
    }


    var sessionId = state.sessionId;
    setTimeout(function () {
      if (sessionId !== state.sessionId) return;   // 期间已经重开了一轮，丢弃本次推进
      state.index++;
      if (state.index >= state.queue.length) {
        finish();
      } else {
        renderItem();
      }
    }, settings.echo ? 750 : 240);
  }


  /* ---------------- 数据看板 ---------------- */

  function masteryBuckets() {
    var pool = (window.WORD_LISTS.all || []).concat(window.SENTENCE_LISTS ? window.SENTENCE_LISTS.all : []);
    var out = { fresh: 0, learning: 0, solid: 0, mastered: 0, total: pool.length };
    pool.forEach(function (item) {
      var rec = window.Srs ? srsDb[window.Srs.keyOf(item)] : null;
      if (!rec) { out.fresh++; return; }
      if (rec.interval >= 21) out.mastered++;
      else if (rec.interval >= 4) out.solid++;
      else out.learning++;
    });
    return out;
  }

  function sparkline(values) {
    if (!values.length) return '';
    var w = 100;
    var h = 40;
    var max = Math.max.apply(null, values);
    var min = Math.min.apply(null, values);
    if (max === min) max = min + 1;
    var pts = values.map(function (v, i) {
      var x = values.length === 1 ? w / 2 : (i / (values.length - 1)) * w;
      var y = h - 3 - ((v - min) / (max - min)) * (h - 8);
      return x.toFixed(2) + ' ' + y.toFixed(2);
    });
    var line = 'M' + pts.join(' L');
    var area = line + ' L' + w + ' ' + h + ' L0 ' + h + ' Z';
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-label="速度趋势">' +
      '<path class="trend-area" d="' + area + '"></path>' +
      '<path class="trend-line" d="' + line + '" vector-effect="non-scaling-stroke"></path>' +
      '</svg>';
  }

  function barRow(label, rate, attempts, errors) {
    var row = document.createElement('div');
    row.className = 'bar-row';

    var key = span('bar-key', label);

    var track = document.createElement('span');
    track.className = 'bar-track';
    var fill = span('bar-fill');
    fill.style.width = Math.max(2, Math.round(rate * 100)) + '%';
    if (rate >= 0.25) fill.classList.add('is-high');
    else if (rate >= 0.12) fill.classList.add('is-mid');
    track.appendChild(fill);

    var val = span('bar-val', Math.round(rate * 100) + '%');
    row.appendChild(key);
    row.appendChild(track);
    row.appendChild(val);
    row.title = label + '：' + errors + ' / ' + attempts + ' 个音节出错';
    return row;
  }

  function renderDashboard() {
    if (!window.Stats || !els.dashSummary) return;

    var sum = window.Stats.summary(statsDb);
    var mastery = masteryBuckets();
    var hasData = sum.sessions > 0 || sum.syllables > 0;
    if (els.dashEmpty) els.dashEmpty.hidden = hasData;

    // 概况
    els.dashSummary.textContent = '';
    [
      ['练习轮数', String(sum.sessions)],
      ['累计音节', String(sum.syllables)],
      ['平均 CPM', String(sum.avgCpm)],
      ['平均正确率', sum.avgAcc ? sum.avgAcc + '%' : '–']
    ].forEach(function (pair) {
      var card = document.createElement('div');
      card.className = 'stat';
      card.appendChild(span('stat-v', pair[1]));
      card.appendChild(span('stat-k', pair[0]));
      els.dashSummary.appendChild(card);
    });

    // 建议专项
    if (els.dashDrills) {
      els.dashDrills.textContent = '';
      var tips = buildSuggestions(4);
      if (!tips.length) {
        els.dashDrills.appendChild(span('panel-empty', '样本还不够，先多练几轮，这里会自动给出建议。'));
      } else {
        tips.forEach(function (tip) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'drill-btn';

          var name = span('drill-label', tip.label);
          var meta = span('drill-meta',
            '错误率 ' + Math.round(tip.rate * 100) + '% · ' + drillSize(tip) + ' 题可用');
          btn.appendChild(name);
          btn.appendChild(meta);
          if (tip.mixed) btn.classList.add('is-mix');

          btn.addEventListener('click', function () { startDrill(tip); });
          els.dashDrills.appendChild(btn);
        });
      }
    }

    // 速度趋势
    els.dashTrend.textContent = '';
    var recent = statsDb.sessions.slice(-20);
    if (recent.length >= 1) {
      var wrap = document.createElement('div');
      wrap.className = 'trend-wrap';
      wrap.innerHTML = sparkline(recent.map(function (x) { return x.cpm || 0; }));
      els.dashTrend.appendChild(wrap);
      var legend = document.createElement('div');
      legend.className = 'trend-legend';
      legend.appendChild(span('', '最低 ' + Math.min.apply(null, recent.map(function (x) { return x.cpm; }))));
      legend.appendChild(span('', '最高 ' + Math.max.apply(null, recent.map(function (x) { return x.cpm; }))));
      legend.appendChild(span('', '最近 ' + recent.length + ' 轮'));
      els.dashTrend.appendChild(legend);
    } else {
      els.dashTrend.appendChild(span('panel-empty', '跑完一轮就能看到趋势。'));
    }
    if (els.dashTrendSub) els.dashTrendSub.textContent = '最近 ' + Math.min(20, recent.length) + ' 轮 · 字符/分';

    // 声母 / 韵母
    els.dashErrors.textContent = '';
    var cols = [
      { title: '声母', rows: window.Stats.rank(statsDb.initials, 3).slice(0, 8) },
      { title: '韵母', rows: window.Stats.rank(statsDb.finals, 3).slice(0, 8) }
    ];
    cols.forEach(function (col) {
      var box = document.createElement('div');
      box.className = 'bar-col';
      box.appendChild(span('bar-col-title', col.title));
      if (!col.rows.length) {
        box.appendChild(span('panel-empty', '样本不足'));
      } else {
        col.rows.forEach(function (r) {
          box.appendChild(barRow(r.key, r.rate, r.attempts, r.errors));
        });
      }
      els.dashErrors.appendChild(box);
    });

    // 声调
    els.dashTones.textContent = '';
    var toneNames = { '1': '一声 ˉ', '2': '二声 ˊ', '3': '三声 ˇ', '4': '四声 ˋ', '5': '轻声' };
    var toneRows = ['1', '2', '3', '4', '5'].map(function (t) {
      var rec = statsDb.tones[t];
      return { t: t, rec: rec };
    }).filter(function (x) { return x.rec && x.rec.a >= 3; });

    if (!toneRows.length) {
      els.dashTones.appendChild(span('panel-empty', '样本不足（开声调模式多练几轮）'));
    } else {
      toneRows.forEach(function (x) {
        els.dashTones.appendChild(barRow(toneNames[x.t], x.rec.e / x.rec.a, x.rec.a, x.rec.e));
      });
    }

    // 掌握分布
    els.dashMastery.textContent = '';
    var segs = [
      { key: 'fresh', label: '未学', n: mastery.fresh },
      { key: 'learning', label: '学习中', n: mastery.learning },
      { key: 'solid', label: '巩固中', n: mastery.solid },
      { key: 'mastered', label: '已掌握', n: mastery.mastered }
    ];
    var total = Math.max(1, mastery.total);
    var bar = document.createElement('div');
    bar.className = 'mastery-bar';
    segs.forEach(function (seg) {
      var part = span('mastery-seg is-' + seg.key);
      part.style.width = (seg.n / total * 100).toFixed(2) + '%';
      part.title = seg.label + '：' + seg.n;
      bar.appendChild(part);
    });
    els.dashMastery.appendChild(bar);

    var legend = document.createElement('div');
    legend.className = 'mastery-legend';
    segs.forEach(function (seg) {
      var item = document.createElement('span');
      item.className = 'mastery-key is-' + seg.key;
      item.appendChild(span('mastery-dot'));
      item.appendChild(span('', seg.label + ' ' + seg.n));
      legend.appendChild(item);
    });
    els.dashMastery.appendChild(legend);
    if (els.dashMasterySub) {
      els.dashMasterySub.textContent = '共 ' + mastery.total + ' 词句 · 间隔 ≥21 天记为已掌握';
    }
  }

  function openDashboard() {
    if (!els.stats) return;
    state.statsOpen = true;
    renderDashboard();
    els.typing.hidden = true;
    els.result.hidden = true;
    els.stats.hidden = false;
    els.focusHint.hidden = true;
    if (document.activeElement === els.catcher) els.catcher.blur();
    els.stats.scrollTop = 0;
  }

  function closeDashboard() {
    state.statsOpen = false;
    if (!els.stats) return;
    els.stats.hidden = true;
    if (state.finished) {
      els.result.hidden = false;
    } else {
      els.typing.hidden = false;
      focusCatcher();
    }
  }

  /* ---------------- 生命周期 ---------------- */

  function startSession() {
    state.sessionId++;
    if (state.statsOpen) {
      state.statsOpen = false;
      if (els.stats) els.stats.hidden = true;
    }
    state.queue = buildQueue();
    state.index = 0;
    state.correctKeys = 0;
    state.errorKeys = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.startedAt = 0;
    state.finished = false;
    state.done = [];
    state.lock = false;

    closeImePopup();
    hideDictTooltip();
    els.result.hidden = true;
    els.typing.hidden = false;
    els.flash.textContent = '';
    renderItem();
    updateStats();
    focusCatcher();
  }

  function finish() {
    state.finished = true;
    if (ticker) { clearInterval(ticker); ticker = null; }
    if (!state.startedAt) state.startedAt = Date.now();

    els.typing.hidden = true;
    els.result.hidden = false;
    els.rsCpm.textContent = String(cpm());
    els.rsAcc.textContent = accuracy() + '%';
    els.rsWords.textContent = String(state.done.length);
    els.rsStreak.textContent = String(state.bestStreak);
    els.rsTime.textContent = formatTime(elapsed());
    if (window.Srs) persistSrs(true);
    if (window.Stats) {
      window.Stats.recordSession(statsDb, {
        t: Date.now(),
        mode: isSentenceMode() ? 'sentence' : 'word',
        level: settings.level,
        items: state.done.length,
        cpm: cpm(),
        acc: accuracy(),
        chars: state.correctKeys,
        ms: elapsed()
      });
      persistStats(true);
    }

    if (els.rsDue && window.Srs) {
      var st = window.Srs.stats(srsDb, poolFor());
      if (st.due > 0) {
        els.rsDue.textContent = '待复习 ' + st.due + ' 题 · 下一轮会优先出现（答错的会 10 分钟后再来）';
      } else if (st.learning > 0) {
        els.rsDue.textContent = '已进入复习排程 ' + st.learning + ' 题 · 间隔按 1 → 3 → 7 天递增（上限 ' +
          window.Srs.MAX_INTERVAL_DAYS + ' 天）';
      } else {
        els.rsDue.textContent = '';
      }
    }

    if (settings.sound) window.Sound.fanfare();

    var missed = state.done.filter(function (entry) { return entry.errors; });
    els.reviewList.textContent = '';
    if (missed.length) {
      missed.slice(0, 12).forEach(function (entry) {
        var item = entry.item;
        var li = document.createElement('li');
        li.className = 'review-item';

        var hz = span('rv-hanzi' + (isSentenceMode() ? ' is-long' : ''), item.hanzi);
        hz.lang = 'zh-Hans';

        var py = span('rv-pinyin', window.Pinyin.toNumbered(item.pinyin.replace(/[，。！？：；、]/g, ' ')));
        var en = span('rv-en', item.english);

        li.appendChild(hz);
        li.appendChild(py);
        li.appendChild(en);
        li.addEventListener('click', function () { speak(item.hanzi); });
        els.reviewList.appendChild(li);
      });
      els.review.hidden = false;
    } else {
      els.review.hidden = true;
    }
    els.again.focus({ preventScroll: true });
  }

  /* ---------------- 事件绑定 ---------------- */

  function focusCatcher() {
    try {
      els.catcher.focus({ preventScroll: true });
    } catch (err) {
      els.catcher.focus();
    }
    els.focusHint.hidden = true;
  }

  function bindSettings() {
    els.mode.addEventListener('change', function () {
      settings.mode = els.mode.value;
      syncModeDropdowns();
      saveSettings();
      startSession();
    });
    if (els.story) {
      els.story.addEventListener('change', function () {
        settings.storyId = els.story.value;
        saveSettings();
        startSession();
      });
    }
    els.level.addEventListener('change', function () {
      settings.level = els.level.value;
      saveSettings();
      startSession();
    });
    els.count.addEventListener('change', function () {
      settings.count = parseInt(els.count.value, 10) || 0;
      saveSettings();
      startSession();
    });

    [['tones', els.tones], ['ime', els.ime], ['echo', els.echo], ['speech', els.speech], ['sound', els.sound]]
      .forEach(function (entry) {
        var key = entry[0];
        var btn = entry[1];
        btn.addEventListener('click', function () {
          settings[key] = !settings[key];
          setPressed(btn, settings[key]);
          saveSettings();
          if (key === 'tones' || key === 'echo' || key === 'ime') startSession();
          if (key === 'sound' && settings.sound) window.Sound.click();
          focusCatcher();
        });
      });

    if (els.tgLang) {
      els.tgLang.addEventListener('click', function () {
        if (window.I18n) {
          window.I18n.toggleLanguage();
          applyTranslations();
          focusCatcher();
        }
      });
    }

    els.theme.addEventListener('click', function () {
      settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', settings.theme);
      saveSettings();
      focusCatcher();
    });

    if (els.runDrill) {
      els.runDrill.addEventListener('click', function () {
        if (state.drill) {
          exitDrill();
          return;
        }
        var tips = buildSuggestions(1);
        if (tips.length) startDrill(tips[0]);
      });
    }


    if (els.btnStrokeClose) els.btnStrokeClose.addEventListener('click', closeStrokeModal);
    if (els.btnStrokeReplay) els.btnStrokeReplay.addEventListener('click', playStrokeAnimation);
    if (els.btnStrokePlay) els.btnStrokePlay.addEventListener('click', playStrokeAnimation);
    if (els.btnStrokePrev) els.btnStrokePrev.addEventListener('click', function () { strokeStep(-1); });
    if (els.btnStrokeNext) els.btnStrokeNext.addEventListener('click', function () { strokeStep(1); });
    if (els.strokeModal) {
      els.strokeModal.addEventListener('click', function (e) {
        if (e.target === els.strokeModal) closeStrokeModal();
      });
    }

    // 点击大汉字打开笔顺浮层
    if (els.hanzi) {
      els.hanzi.addEventListener('click', function () {
        openStrokeModal(els.hanzi.textContent.trim());
      });
    }

    // 监听高保真语音发音状态，触发声波微动效
    if (window.Speech && window.Speech.setOnSpeakingChange) {
      window.Speech.setOnSpeakingChange(function (isSpeaking) {
        if (els.voiceWave) els.voiceWave.hidden = !isSpeaking;
      });
    }
    if (els.voiceWave) {
      els.voiceWave.addEventListener('click', function () {
        if (window.Speech) window.Speech.replay();
      });
    }

    // 句模式下点击单个字打开笔顺
    if (els.sentence) {
      els.sentence.addEventListener('click', function (e) {
        var hzEl = e.target.closest('.u-hz');
        if (hzEl) openStrokeModal(hzEl.textContent.trim());
      });
    }

    if (els.btnShowStroke) els.btnShowStroke.addEventListener('click', function () { openStrokeModal(); });

    if (els.dtBtnSpeak) {
      els.dtBtnSpeak.addEventListener('click', function () {
        if (state.dictChar) speak(state.dictChar);
      });
    }
    if (els.dtBtnStroke) {
      els.dtBtnStroke.addEventListener('click', function () {
        var ch = state.dictChar;
        hideDictTooltip();
        openStrokeModal(ch);
      });
    }
    if (els.dictTooltip) {
      els.dictTooltip.addEventListener('mouseenter', function () {
        clearTimeout(state.dictTimer);
      });
      els.dictTooltip.addEventListener('mouseleave', function () {
        hideDictTooltip();
      });
    }
    document.addEventListener('click', function (e) {
      if (els.dictTooltip && !els.dictTooltip.hidden && !els.dictTooltip.contains(e.target)) {
        hideDictTooltip();
      }
    });

    if (els.btnStats) els.btnStats.addEventListener('click', openDashboard);
    if (els.btnDashFromResult) els.btnDashFromResult.addEventListener('click', openDashboard);
    if (els.btnDashBack) els.btnDashBack.addEventListener('click', closeDashboard);
    if (els.btnDashReset) {
      els.btnDashReset.addEventListener('click', function () {
        if (!window.confirm('清空统计数据与复习记录？此操作不可撤销。')) return;
        if (window.Stats) { window.Stats.reset(); statsDb = window.Stats.empty(); }
        if (window.Srs) { window.Srs.reset(); srsDb = {}; }
        renderDashboard();
        flash('统计与复习记录已清空', 'good');
      });
    }

    els.again.addEventListener('click', function () { startSession(); });
    els.newset.addEventListener('click', function () { startSession(); });

    els.reveal.addEventListener('click', function () {
      els.card.classList.remove('masked');
      els.reveal.hidden = true;
      focusCatcher();
    });
  }

  function bindInput() {
    var catcher = els.catcher;

    catcher.addEventListener('input', function (e) {
      if (e.isComposing) return;
      var value = catcher.value;
      if (value) {
        for (var i = 0; i < value.length; i++) handleChar(value[i]);
      }
      catcher.value = '';
    });

    catcher.addEventListener('keydown', function (e) {
      if (settings.ime && state.imeBufferText) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          // 选择第 1 候选词
          var first = state.imeList[state.imePage * IME_PAGE_SIZE];
          if (first) chooseImeCandidate(first);
          return;
        }
        if (/^[1-5]$/.test(e.key)) {
          e.preventDefault();
          var idx = parseInt(e.key, 10) - 1;
          var cand = state.imeList[state.imePage * IME_PAGE_SIZE + idx];
          if (cand) chooseImeCandidate(cand);
          return;
        }
        if (e.key === '=' || e.key === 'PageDown') {
          e.preventDefault();
          state.imePage++;
          renderImePopup();
          return;
        }
        if (e.key === '-' || e.key === 'PageUp') {
          e.preventDefault();
          state.imePage--;
          renderImePopup();
          return;
        }
        if (e.key === 'Backspace') {
          e.preventDefault();
          state.imeBufferText = state.imeBufferText.slice(0, -1);
          renderImePopup();
          return;
        }
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        startSession();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        startSession();
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        if (!state.finished) {
          els.card.classList.remove('masked');
          els.reveal.hidden = true;
        }
      }
    });

    catcher.addEventListener('focus', function () { els.focusHint.hidden = true; });
    catcher.addEventListener('blur', function () {
      if (!state.finished && !state.statsOpen) els.focusHint.hidden = false;
    });

    document.addEventListener('keydown', function (e) {
      if (state.strokeOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeStrokeModal();
        }
        return;
      }
      if (state.statsOpen) {
        if (e.key === 'Escape' || e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          closeDashboard();
        }
        return;
      }
      if ((e.key === 's' || e.key === 'S') && (e.altKey || e.metaKey || document.activeElement !== els.catcher)) {
        e.preventDefault();
        openStrokeModal();
        return;
      }
      if ((e.key === 'r' || e.key === 'R') && (e.altKey || e.metaKey || document.activeElement !== els.catcher)) {
        e.preventDefault();
        if (window.Speech) window.Speech.replay();
        return;
      }
    });

    document.addEventListener('mousedown', function (e) {
      if (state.statsOpen) return;
      if (e.target.closest('button, select, option, a, .catcher')) return;
      focusCatcher();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        window.Speech.stop();
        persistSrs(true);          // 切走/关页前落盘，避免丢记录
        persistStats(true);
      }
    });

    window.addEventListener('pagehide', function () {
      persistSrs(true);
      persistStats(true);
    });
  }

  function bootError(err) {
    var message = err && err.message ? err.message : String(err);
    document.documentElement.setAttribute('data-boot-error', message);
    document.documentElement.setAttribute('data-app-ready', '0');
    els.flash.textContent = '启动失败：' + message;
    els.flash.className = 'flash is-bad';
    if (window.console && console.error) console.error('[echo-hanzi] boot failed', err);
  }

  function boot() {
    try {
      bootInner();
    } catch (err) {
      bootError(err);
    }
  }

  function bootInner() {
    applySettingsToUI();
    applyTranslations();
    bindSettings();
    bindInput();
    if (!window.Speech.supported) {
      settings.speech = false;
      setPressed(els.speech, false);
      els.speech.title = '当前浏览器不支持语音合成';
    }
    if (!window.SENTENCE_LISTS) settings.mode = 'word';
    startSession();
    setTimeout(focusCatcher, 60);
    document.documentElement.setAttribute('data-app-ready', '1');
    registerServiceWorker();
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      // 避免在测试环境（?t=...）中带来干扰
      if (location.search.indexOf('drill') !== -1 || location.search.indexOf('srs') !== -1) return;
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
