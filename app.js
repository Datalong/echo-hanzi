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
    screenHome: $('screen-home'),
    homeStreak: $('home-streak'),
    homeDue: $('home-due'),
    homeSrs: $('home-srs'),
    homeWeak: $('home-weak'),
    homeRecent: $('home-recent'),
    homeCards: $('home-cards'),
    btnHomeStart: $('btn-home-start'),
    btnHomeDash: $('btn-home-dash'),
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
    btnShareCard: $('btn-share-card'),
    shareModal: $('share-modal'),
    shareTitle: $('share-title'),
    sharePreviewImg: $('share-preview-img'),
    btnShareClose: $('btn-share-close'),
    btnCopyPoster: $('btn-copy-poster'),
    btnDownloadPoster: $('btn-download-poster'),
    tabWrite: $('tab-write'),
    tabSpeak: $('tab-speak'),
    tabListen: $('tab-listen'),
    tabRead: $('tab-read'),
    screenSpeak: $('screen-speak'),
    screenListen: $('screen-listen'),
    screenRead: $('screen-read'),
    spkRunPos: $('spk-run-pos'),
    spkTargetHz: $('spk-target-hz'),
    spkTargetPy: $('spk-target-py'),
    spkTargetEn: $('spk-target-en'),
    spkResultBox: $('spk-result-box'),
    spkTrans: $('spk-trans'),
    spkScoreVal: $('spk-score-val'),
    spkScoreDesc: $('spk-score-desc'),
    btnSpkListen: $('btn-spk-listen'),
    btnMic: $('btn-mic'),
    micLabel: $('mic-label'),
    btnSpkNext: $('btn-spk-next'),
    lsnRunPos: $('lsn-run-pos'),
    btnLsnSlow: $('btn-lsn-slow'),
    btnLsnPlay: $('btn-lsn-play'),
    lsnTargetHz: $('lsn-target-hz'),
    lsnTargetEn: $('lsn-target-en'),
    lsnInput: $('lsn-input'),
    btnLsnCheck: $('btn-lsn-check'),
    lsnFeedback: $('lsn-feedback'),
    readStoryTitle: $('read-story-title'),
    readStoryIntro: $('read-story-intro'),
    readArticle: $('read-article'),
    btnImport: $('btn-import'),
    importModal: $('import-modal'),
    btnImportClose: $('btn-import-close'),
    importName: $('import-name'),
    importText: $('import-text'),
    btnImportSave: $('btn-import-save'),
    btnImportDelete: $('btn-import-delete'),
    importList: $('import-list'),
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
    dictChar: '',
    shareCanvas: null,
    currentHub: 'home',
    speakIndex: 0,
    listenIndex: 0,
    readStoryId: 'beijing-trip'
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

    var q = function(id, text) { var el = $(id); if (el) el.textContent = text; };

    q('tab-home', t('navHome'));
    q('tab-write', t('navWrite'));
    q('tab-speak', t('navSpeak'));
    q('tab-listen', t('navListen'));
    q('tab-read', t('navRead'));
    q('btn-spk-listen', t('btnSpkListen'));
    q('btn-spk-next', t('btnSpkNext'));
    q('btn-lsn-slow', t('lsnSpeedSlow'));
    q('btn-lsn-play', t('lsnPlay'));
    q('btn-lsn-check', t('lsnCheck'));
    if (els.lsnInput) els.lsnInput.placeholder = t('lsnPlaceholder');

    // 顶栏 Label
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
    q('btn-share-card', t('btnShareCard'));
    q('share-title', t('shareTitle'));
    q('btn-copy-poster', t('btnCopyPoster'));
    q('btn-download-poster', t('btnDownloadPoster'));
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
    if (state.currentHub === 'home') renderHomeScreen();
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






  /* ---------------- 自定义内容导入 ---------------- */

  function renderImportList() {
    if (!els.importList || !window.Custom) return;
    var items = window.Custom.load();
    els.importList.textContent = '';
    if (!items.length) {
      els.importList.appendChild(span('panel-empty', '还没有导入的内容'));
      els.btnImportDelete.hidden = true;
      return;
    }
    items.forEach(function (entry) {
      var row = document.createElement('div');
      row.className = 'import-item';
      var left = document.createElement('div');
      left.appendChild(span('import-item-name', entry.title));
      left.appendChild(span('import-item-meta', ' · ' + entry.sentences.length + ' 句'));
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'import-item-del';
      del.textContent = '删除';
      del.addEventListener('click', function () {
        window.Custom.remove(entry.id);
        renderImportList();
      });
      row.appendChild(left);
      row.appendChild(del);
      els.importList.appendChild(row);
    });
  }

  function openImportModal() {
    if (!els.importModal || !window.Custom) return;
    els.importName.value = '';
    els.importText.value = '';
    renderImportList();
    els.importModal.hidden = false;
  }

  function closeImportModal() {
    if (els.importModal) els.importModal.hidden = true;
    if (state.currentHub === 'write') focusCatcher();
  }

  function saveImported() {
    var text = (els.importText.value || '').trim();
    if (!text) {
      flash('请先粘贴中文内容', 'bad');
      return;
    }
    var entry = window.Custom.add((els.importName.value || '').trim(), text);
    if (!entry) {
      flash('没有识别到汉字内容', 'bad');
      return;
    }
    flash('导入成功：' + entry.sentences.length + ' 句已加入题库', 'good');
    closeImportModal();
    if (state.currentHub === 'write') startSession();
    else if (state.currentHub === 'speak') renderSpeakScreen();
    else if (state.currentHub === 'listen') renderListenScreen();
    else if (state.currentHub === 'read') renderReadScreen();
  }

  /* ---------------- 四大核心沉浸中心路由 ---------------- */

  function switchHub(hub) {
    state.currentHub = hub;
    document.querySelectorAll('.hub-tab').forEach(function (tab) {
      tab.classList.toggle('is-active', tab.dataset.hub === hub);
    });

    els.typing.hidden = (hub !== 'write');
    els.screenHome.hidden = (hub !== 'home');
    els.screenSpeak.hidden = (hub !== 'speak');
    els.screenListen.hidden = (hub !== 'listen');
    els.screenRead.hidden = (hub !== 'read');

    // 打字专属控件仅在 write hub 显示
    var writeControls = document.querySelector('.controls');
    if (writeControls) writeControls.hidden = (hub !== 'write');
    els.result.hidden = true;
    if (els.stats) els.stats.hidden = true;

    if (hub === 'home') {
      renderHomeScreen();
    } else if (hub === 'write') {
      focusCatcher();
    } else if (hub === 'speak') {
      renderSpeakScreen();
    } else if (hub === 'listen') {
      renderListenScreen();
    } else if (hub === 'read') {
      renderReadScreen();
    }
  }

  /* ---------------- 🏠 学习总览 (Home) ---------------- */

  /** 连续练习天数：从最近一次向前数连续有练习的自然日 */
  function calcStreak() {
    if (!statsDb || !statsDb.sessions.length) return 0;
    var days = {};
    statsDb.sessions.forEach(function (s) {
      if (s.t) days[new Date(s.t).toDateString()] = true;
    });
    var streak = 0;
    var cursor = new Date();
    // 今天没练也不断链，从昨天起算
    if (!days[cursor.toDateString()]) cursor.setDate(cursor.getDate() - 1);
    while (days[cursor.toDateString()]) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function renderHomeScreen() {
    // 刷新本地缓存，拿到最新练习/SRS 数据
    if (window.Stats) statsDb = window.Stats.load();
    if (window.Srs) srsDb = window.Srs.load();

    var sum = window.Stats ? window.Stats.summary(statsDb) : { sessions: 0, avgCpm: 0, avgAcc: 0 };

    // 待复习数：全词库 + 句库 + 自定义
    var pool = (window.WORD_LISTS.all || []).slice();
    if (window.SENTENCE_LISTS) pool = pool.concat(window.SENTENCE_LISTS.all || []);
    if (window.Custom) {
      window.Custom.load().forEach(function (entry) {
        pool = pool.concat(window.Custom.toItems(entry));
      });
    }
    var dueCount = window.Srs ? window.Srs.dueItems(srsDb, pool).length : 0;

    if (els.homeStreak) els.homeStreak.textContent = String(calcStreak());
    if (els.homeDue) els.homeDue.textContent = String(dueCount);

    // 记忆状态四档
    if (els.homeSrs) {
      var m = masteryBuckets();
      els.homeSrs.textContent = '';
      [
        ['srs-fresh', m.fresh, t('homeFresh')],
        ['srs-learning', m.learning, t('homeLearning')],
        ['srs-solid', m.solid, t('homeSolid')],
        ['srs-mastered', m.mastered, t('homeMastered')]
      ].forEach(function (pair) {
        var box = document.createElement('div');
        box.className = 'srs-cell ' + pair[0];
        box.appendChild(span('srs-cell-v', String(pair[1])));
        box.appendChild(span('srs-cell-k', pair[2]));
        els.homeSrs.appendChild(box);
      });
    }

    // 今日弱项
    if (els.homeWeak) {
      els.homeWeak.textContent = '';
      var tips = buildSuggestions(3);
      if (!tips.length) {
        els.homeWeak.appendChild(span('panel-empty', t('homeWeakEmpty')));
      } else {
        tips.forEach(function (tip) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'drill-btn home-drill';
          btn.appendChild(span('drill-label', tip.label));
          btn.appendChild(span('drill-meta', '错误率 ' + Math.round(tip.rate * 100) + '%'));
          btn.addEventListener('click', function () {
            switchHub('write');
            startDrill(tip);
          });
          els.homeWeak.appendChild(btn);
        });
      }
    }

    // 最近练习
    if (els.homeRecent) {
      els.homeRecent.textContent = '';
      var recent = (statsDb && statsDb.sessions ? statsDb.sessions.slice(-5) : []).reverse();
      if (!recent.length) {
        els.homeRecent.appendChild(span('panel-empty', t('homeRecentEmpty')));
      } else {
        recent.forEach(function (s) {
          var row = document.createElement('div');
          row.className = 'recent-row';
          var d = s.t ? new Date(s.t) : null;
          row.appendChild(span('recent-when', d ?
            (d.getMonth() + 1) + '/' + d.getDate() + ' ' +
            ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) : '–'));
          row.appendChild(span('recent-meta',
            (s.cpm || 0) + ' CPM · ' + (s.acc || 0) + '% · ' + (s.items || 0) + ' ' + t('unitWord')));
          els.homeRecent.appendChild(row);
        });
      }
    }
  }

  /* ---------------- 🎙️ 跟读中心 (Speak) ---------------- */

  function getSentencePool() {
    var base = (window.SENTENCE_LISTS && window.SENTENCE_LISTS.all) || [];
    var custom = [];
    if (window.Custom) {
      window.Custom.load().forEach(function (entry) {
        custom = custom.concat(window.Custom.toItems(entry));
      });
    }
    return custom.length ? custom.concat(base) : base;
  }

  function renderSpeakScreen() {
    var pool = getSentencePool();
    if (!pool.length) return;
    if (state.speakIndex >= pool.length) state.speakIndex = 0;
    var item = pool[state.speakIndex];

    els.spkRunPos.textContent = (state.speakIndex + 1) + ' / ' + pool.length + ' ' + t('unitSentence');
    els.spkTargetHz.textContent = item.hanzi;
    els.spkTargetPy.textContent = item.pinyin.replace(/[，。！？]/g, ' ');
    els.spkTargetEn.textContent = item.english;
    els.spkResultBox.hidden = true;

    if (els.micLabel) els.micLabel.textContent = t('btnMicIdle');
    if (els.btnMic) els.btnMic.classList.remove('is-recording');
  }

  function setupSpeechRec() {
    if (!window.SpeechRec) return;
    window.SpeechRec.setCallbacks({
      onTranscript: function (text) {
        if (!els.spkTrans) return;
        els.spkTrans.textContent = text;
        els.spkResultBox.hidden = false;
      },
      onResult: function (evalRes) {
        if (!els.spkResultBox) return;
        els.spkResultBox.hidden = false;
        els.spkTrans.textContent = '';

        (evalRes.charStatuses || []).forEach(function (cs) {
          var sp = span('spk-ch is-' + cs.status, cs.ch);
          els.spkTrans.appendChild(sp);
        });

        els.spkScoreVal.textContent = evalRes.accuracy + '%';
        if (evalRes.accuracy >= 90) {
          els.spkScoreDesc.textContent = t('spkPerfect');
          if (settings.sound) window.Sound.success();
        } else if (evalRes.accuracy >= 70) {
          els.spkScoreDesc.textContent = t('spkGood');
          if (settings.sound) window.Sound.click();
        } else {
          els.spkScoreDesc.textContent = t('spkTryAgain');
          if (settings.sound) window.Sound.error();
        }
      },
      onStateChange: function (isRec) {
        if (!els.btnMic) return;
        els.btnMic.classList.toggle('is-recording', isRec);
        if (els.micLabel) {
          els.micLabel.textContent = isRec ? t('btnMicRecording') : t('btnMicIdle');
        }
      },
      onError: function (err) {
        flash('麦克风识别错误: ' + err, 'bad');
      }
    });
  }

  /* ---------------- 🎧 听力中心 (Listen) ---------------- */

  var isListenSlow = false;

  function renderListenScreen() {
    var pool = getSentencePool();
    if (!pool.length) return;
    if (state.listenIndex >= pool.length) state.listenIndex = 0;
    var item = pool[state.listenIndex];

    els.lsnRunPos.textContent = (state.listenIndex + 1) + ' / ' + pool.length + ' ' + t('unitSentence');
    els.lsnTargetHz.textContent = item.hanzi.replace(/[^，。！？]/g, '？');
    els.lsnTargetEn.textContent = item.english;
    els.lsnInput.value = '';
    els.lsnFeedback.hidden = true;
  }

  function playListenAudio() {
    var pool = getSentencePool();
    var item = pool[state.listenIndex];
    if (item && window.Speech) {
      window.Speech.speak(item.hanzi, isListenSlow ? 0.7 : 0.85);
    }
  }

  function checkListenAnswer() {
    var pool = getSentencePool();
    var item = pool[state.listenIndex];
    if (!item) return;

    var val = (els.lsnInput.value || '').toLowerCase().trim();
    var targetHz = item.hanzi.replace(/[，。！？]/g, '').trim();
    var targetPy = window.Pinyin ? window.Pinyin.toPlain(item.pinyin).replace(/[^a-z]/g, '') : '';
    var inputClean = val.replace(/[^a-z一-龥]/g, '');

    var isCorrect = (val === targetHz) || (inputClean === targetPy);
    if (isCorrect) {
      els.lsnTargetHz.textContent = item.hanzi;
      els.lsnFeedback.textContent = t('lsnCorrect');
      els.lsnFeedback.className = 'listen-feedback';
      els.lsnFeedback.hidden = false;
      if (settings.sound) window.Sound.success();
      setTimeout(function () {
        state.listenIndex++;
        renderListenScreen();
      }, 1200);
    } else {
      els.lsnFeedback.textContent = t('lsnWrong');
      els.lsnFeedback.className = 'listen-feedback is-bad';
      els.lsnFeedback.hidden = false;
      if (settings.sound) window.Sound.error();
    }
  }

  /* ---------------- 📖 阅读中心 (Read) ---------------- */

  function renderReadScreen() {
    if (!window.Stories || !els.readArticle) return;
    var st = window.Stories.getById(state.readStoryId);
    els.readStoryTitle.textContent = st.title;
    els.readStoryIntro.textContent = st.englishTitle + ' · ' + st.intro;
    els.readArticle.textContent = '';

    st.sentences.forEach(function (s) {
      var p = document.createElement('div');
      p.className = 'read-para';

      // 汉字支持划词与即时微词典
      Array.from(s.hanzi).forEach(function (ch) {
        var sp = span('read-ch', ch);
        if (!/[，。！？\s]/.test(ch)) {
          setupDictHover(sp);
        }
        p.appendChild(sp);
      });

      var en = span('story-line-en', s.english);
      p.appendChild(en);

      p.addEventListener('click', function () {
        if (window.Speech) window.Speech.speak(s.hanzi);
      });

      els.readArticle.appendChild(p);
    });
  }

  /* ---------------- 战绩海报分享 ---------------- */

  function collectSessionChars() {
    var chars = [];
    state.done.forEach(function (entry) {
      var item = entry.item || entry.word;
      if (item && item.hanzi) {
        Array.from(item.hanzi).forEach(function (ch) {
          if (!/[，。！？：；、“”\s,.!?]/.test(ch) && chars.indexOf(ch) === -1) {
            chars.push(ch);
          }
        });
      }
    });
    return chars;
  }

  function openShareModal() {
    if (!window.Share || !els.shareModal) return;
    var lang = window.I18n ? window.I18n.getLang() : 'zh-CN';

    var modeName = isStoryMode() ? t('optStory') : (isSentenceMode() ? t('optSentence') : t('optWord'));
    var levelName = isStoryMode() ? (currentItem() ? currentItem().storyTitle : 'Story') : settings.level.toUpperCase();

    var data = {
      cpm: cpm(),
      acc: accuracy(),
      streak: state.bestStreak,
      words: state.done.length,
      time: formatTime(elapsed()),
      characters: collectSessionChars(),
      modeName: modeName,
      level: levelName,
      lang: lang
    };

    var canvas = window.Share.createResultCard(data);
    state.shareCanvas = canvas;
    if (canvas && els.sharePreviewImg) {
      els.sharePreviewImg.src = canvas.toDataURL('image/png');
    }

    els.shareModal.hidden = false;
  }

  function closeShareModal() {
    if (els.shareModal) els.shareModal.hidden = true;
    state.shareCanvas = null;
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
    if (isSentenceMode() && !state.drill && window.Custom) {
      var customItems = [];
      window.Custom.load().forEach(function (entry) {
        customItems = customItems.concat(window.Custom.toItems(entry));
      });
      if (customItems.length) pool = customItems.concat(pool);
    }
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
    setupSpeechRec();
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


    if (els.btnShareCard) els.btnShareCard.addEventListener('click', openShareModal);
    if (els.btnShareClose) els.btnShareClose.addEventListener('click', closeShareModal);
    if (els.shareModal) {
      els.shareModal.addEventListener('click', function (e) {
        if (e.target === els.shareModal) closeShareModal();
      });
    }
    if (els.btnDownloadPoster) {
      els.btnDownloadPoster.addEventListener('click', function () {
        if (state.shareCanvas && window.Share) {
          window.Share.downloadCard(state.shareCanvas, 'echo-hanzi-result-' + Date.now() + '.png');
        }
      });
    }
    if (els.btnCopyPoster) {
      els.btnCopyPoster.addEventListener('click', function () {
        if (state.shareCanvas && window.Share) {
          window.Share.copyCardToClipboard(state.shareCanvas, function () {
            flash(t('msgCopied'), 'good');
          }, function () {
            // 后备：直接触发下载
            window.Share.downloadCard(state.shareCanvas, 'echo-hanzi-result.png');
            flash('已自动为您下载海报图片', 'good');
          });
        }
      });
    }


    // Hub 导航绑定
    document.querySelectorAll('.hub-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchHub(btn.dataset.hub);
      });
    });

    // 总览页跳转绑定
    if (els.homeCards) {
      els.homeCards.querySelectorAll('.home-card').forEach(function (card) {
        card.addEventListener('click', function () {
          switchHub(card.dataset.goto);
        });
      });
    }
    if (els.btnHomeStart) {
      els.btnHomeStart.addEventListener('click', function () { switchHub('write'); });
    }
    if (els.btnHomeDash) {
      els.btnHomeDash.addEventListener('click', function () {
        state.statsOpen = true;
        renderDashboard();
        els.stats.hidden = false;
      });
    }

    // Speak 绑定
    if (els.btnSpkListen) {
      els.btnSpkListen.addEventListener('click', function () {
        var pool = getSentencePool();
        var item = pool[state.speakIndex];
        if (item && window.Speech) window.Speech.speak(item.hanzi, 0.82);
      });
    }
    if (els.btnMic) {
      els.btnMic.addEventListener('click', function () {
        if (!window.SpeechRec) return;
        var pool = getSentencePool();
        var item = pool[state.speakIndex];
        if (window.SpeechRec.isListening()) {
          window.SpeechRec.stopListening();
        } else if (item) {
          window.SpeechRec.startListening(item.hanzi);
        }
      });
    }
    if (els.btnSpkNext) {
      els.btnSpkNext.addEventListener('click', function () {
        state.speakIndex++;
        renderSpeakScreen();
      });
    }

    // Listen 绑定
    if (els.btnLsnPlay) {
      els.btnLsnPlay.addEventListener('click', playListenAudio);
    }
    if (els.btnLsnSlow) {
      els.btnLsnSlow.addEventListener('click', function () {
        isListenSlow = !isListenSlow;
        els.btnLsnSlow.classList.toggle('is-active', isListenSlow);
        playListenAudio();
      });
    }
    if (els.btnLsnCheck) {
      els.btnLsnCheck.addEventListener('click', checkListenAnswer);
    }
    if (els.lsnInput) {
      els.lsnInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') checkListenAnswer();
      });
    }

    if (els.btnImport) els.btnImport.addEventListener('click', openImportModal);
    if (els.btnImportClose) els.btnImportClose.addEventListener('click', closeImportModal);
    if (els.importModal) {
      els.importModal.addEventListener('click', function (e) {
        if (e.target === els.importModal) closeImportModal();
      });
    }
    if (els.btnImportSave) els.btnImportSave.addEventListener('click', saveImported);
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
      if (els.importModal && !els.importModal.hidden) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeImportModal();
        }
        return;
      }
      if (els.shareModal && !els.shareModal.hidden) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeShareModal();
        }
        return;
      }
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
    setupSpeechRec();
    bindSettings();
    bindInput();
    if (!window.Speech.supported) {
      settings.speech = false;
      setPressed(els.speech, false);
      els.speech.title = '当前浏览器不支持语音合成';
    }
    if (!window.SENTENCE_LISTS) settings.mode = 'word';
    startSession();
    switchHub('home');
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
