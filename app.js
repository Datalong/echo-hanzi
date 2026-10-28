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
    count: 20,
    tones: false,
    echo: false,
    speech: true,
    sound: true,
    theme: 'dark'
  };

  var els = {
    mode: $('sel-mode'),
    level: $('sel-level'),
    count: $('sel-count'),
    tones: $('tg-tones'),
    echo: $('tg-echo'),
    speech: $('tg-speech'),
    sound: $('tg-sound'),
    theme: $('tg-theme'),
    progress: $('progress-fill'),
    runPos: $('run-pos'),
    runLevel: $('run-level'),
    runMode: $('run-mode'),
    runDue: $('run-due'),
    cardBadge: $('card-badge'),
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
    statsOpen: false
  };
  var srsDb = window.Srs ? window.Srs.load() : {};
  var srsSaveTimer = null;
  var statsDb = window.Stats ? window.Stats.load() : null;
  var statsSaveTimer = null;
  var ticker = null;

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
    return settings.mode === 'sentence';
  }

  function applySettingsToUI() {
    els.mode.value = settings.mode;
    els.level.value = settings.level;
    els.count.value = String(settings.count);
    setPressed(els.tones, settings.tones);
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

  /** 到期题目优先，其余随机补齐；同时记录“本轮哪些是复习” */
  function buildQueue() {
    var pool = poolFor();
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
    els.hanzi.hidden = isSentenceMode();
    els.pinyin.hidden = isSentenceMode();
    els.sentence.hidden = !isSentenceMode();

    buildDom();

    var isReview = !!state.reviewKeys[window.Srs ? window.Srs.keyOf(item) : ''];
    if (els.cardBadge) {
      els.cardBadge.textContent = isReview ? '复习' : (isSentenceMode() ? '新句' : '新词');
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
    return isSentenceMode() ? '句' : '词';
  }

  function updateRunLine() {
    var total = state.queue.length;
    var item = currentItem();
    els.runPos.textContent = Math.min(state.index + 1, total) + ' / ' + total + ' ' + runUnit();
    els.runLevel.textContent = item ? item.level : settings.level.toUpperCase();
    var modes = [];
    if (settings.tones) modes.push('含声调');
    if (settings.echo) modes.push('听音模式');
    if (isSentenceMode()) modes.push('句型');
    els.runMode.textContent = modes.join(' · ');

    if (els.runDue) {
      if (state.dueCount > 0) {
        els.runDue.textContent = '待复习 ' + state.dueCount;
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
    window.Speech.speak(text, isSentenceMode() ? 0.8 : 0.85);
  }

  function playClick() {
    if (settings.sound) window.Sound.click();
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
    if (state.finished || state.lock || state.statsOpen) return;

    var ch = String(raw).toLowerCase();
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
      saveSettings();
      startSession();
    });
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

    [['tones', els.tones], ['echo', els.echo], ['speech', els.speech], ['sound', els.sound]]
      .forEach(function (entry) {
        var key = entry[0];
        var btn = entry[1];
        btn.addEventListener('click', function () {
          settings[key] = !settings[key];
          setPressed(btn, settings[key]);
          saveSettings();
          if (key === 'tones' || key === 'echo') startSession();
          if (key === 'sound' && settings.sound) window.Sound.click();
          focusCatcher();
        });
      });

    els.theme.addEventListener('click', function () {
      settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', settings.theme);
      saveSettings();
      focusCatcher();
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
      if (!state.statsOpen) return;
      if (e.key === 'Escape' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        closeDashboard();
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
