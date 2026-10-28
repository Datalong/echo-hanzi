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
    sessionId: 0
  };
  var srsDb = window.Srs ? window.Srs.load() : {};
  var srsSaveTimer = null;
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

    if (!isSentenceMode()) {
      var cells = window.Pinyin.buildCells(item.pinyin, tones);
      var ci = 0;
      cells.forEach(function (cell) {
        cell.charIndex = 0;
        flat.push(cell);
      });
      chars.push({ text: item.hanzi, cells: cells, start: 0, end: flat.length, punct: false });
      return { chars: chars, cells: flat };
    }

    // 句模式：先分离音节与标点键位，再逐字配对
    var syllables = [];
    var punctKeys = [];
    item.pinyin
      .split(/([，。！？：；、,.!?;:]+)/)
      .filter(function (piece) { return piece.trim().length > 0; })
      .forEach(function (piece) {
        if (/^[，。！？：；、,.!?;:]+$/.test(piece)) {
          Array.from(piece).forEach(function (mark) { punctKeys.push(PUNCT_KEYS[mark] || mark); });
        } else {
          window.Pinyin.parse(piece).forEach(function (syl) { syllables.push(syl); });
        }
      });

    var si = 0;
    var pi = 0;
    Array.from(item.hanzi).forEach(function (ch) {
      var start = flat.length;
      var isPunct = PUNCT_RE.test(ch);
      var cells;
      if (isPunct) {
        cells = [punctCell(punctKeys[pi++] || PUNCT_KEYS[ch] || ch)];
      } else {
        var syl = syllables[si++];
        cells = syl ? window.Pinyin.cellsForSyllable(syl, tones) : [];
      }
      var charIndex = chars.length;
      cells.forEach(function (cell, k) {
        cell.charIndex = charIndex;
        cell.group = k;
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

    return { chars: chars, cells: flat };
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

  function ensureStarted() {
    if (state.startedAt || state.finished) return;
    state.startedAt = Date.now();
    if (!ticker) ticker = setInterval(updateStats, 200);
  }

  function handleChar(raw) {
    if (state.finished || state.lock) return;

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

  /* ---------------- 生命周期 ---------------- */

  function startSession() {
    state.sessionId++;
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
      if (!state.finished) els.focusHint.hidden = false;
    });

    document.addEventListener('mousedown', function (e) {
      if (e.target.closest('button, select, option, a, .catcher')) return;
      focusCatcher();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        window.Speech.stop();
        persistSrs(true);          // 切走/关页前落盘，避免丢复习记录
      }
    });

    window.addEventListener('pagehide', function () { persistSrs(true); });
  }

  function boot() {
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
