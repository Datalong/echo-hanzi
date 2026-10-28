/* audio.js — 高保真音频与智能发音引擎（Neural TTS 优选 + Web Audio 打字音效） */
(function (global) {
  'use strict';

  var ctx = null;

  function getCtx() {
    if (!ctx) {
      var Ctor = global.AudioContext || global.webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function blip(opts) {
    var c = getCtx();
    if (!c) return;
    var t = c.currentTime;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(opts.freq, t);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t + opts.dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(opts.vol, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + opts.dur + 0.03);
  }

  var Sound = {
    unlock: function () { getCtx(); },
    click: function () {
      blip({ freq: 820 + Math.random() * 360, dur: 0.045, type: 'triangle', vol: 0.045 });
    },
    error: function () {
      blip({ freq: 240, slideTo: 130, dur: 0.16, type: 'sawtooth', vol: 0.07 });
    },
    success: function () {
      blip({ freq: 880, dur: 0.09, type: 'sine', vol: 0.06 });
      setTimeout(function () {
        blip({ freq: 1320, dur: 0.13, type: 'sine', vol: 0.05 });
      }, 75);
    },
    fanfare: function () {
      [660, 880, 1100, 1320].forEach(function (f, i) {
        setTimeout(function () {
          blip({ freq: f, dur: 0.16, type: 'sine', vol: 0.05 });
        }, i * 90);
      });
    }
  };

  /* ---------------- 高保真自然语音引擎 (Neural Speech Engine) ---------------- */

  var Speech = (function () {
    var supported = typeof global.speechSynthesis !== 'undefined' &&
      typeof global.SpeechSynthesisUtterance !== 'undefined';
    
    var currentVoice = null;
    var availableVoices = [];
    var lastSpokenText = '';
    var onSpeakingChange = null;

    // 优先选择微软自然真人语音 (Xiaoxiao/Yunxi Natural) 或苹果 Premium 自然发音
    function scoreVoice(v) {
      if (!v || !v.lang || !/^zh/i.test(v.lang)) return -1;
      var score = 10;
      var name = (v.name || '').toLowerCase();
      var uri = (v.voiceURI || '').toLowerCase();

      // 大陆普通话优先于台湾/香港方言
      if (/zh[-_]cn/i.test(v.lang) || /cmn[-_]hans/i.test(v.lang)) score += 20;

      // 微软自然语音 (Neural / Natural)
      if (name.indexOf('natural') !== -1 || uri.indexOf('natural') !== -1) score += 50;
      if (name.indexOf('online') !== -1 || uri.indexOf('online') !== -1) score += 30;
      if (name.indexOf('xiaoxiao') !== -1 || uri.indexOf('xiaoxiao') !== -1) score += 40;
      if (name.indexOf('yunxi') !== -1 || uri.indexOf('yunxi') !== -1) score += 35;

      // 苹果高质量语音 (Premium / Enhanced)
      if (name.indexOf('premium') !== -1 || name.indexOf('enhanced') !== -1) score += 35;
      if (name.indexOf('tingting') !== -1) score += 20;

      return score;
    }

    function refreshVoices() {
      if (!supported) return;
      var all = global.speechSynthesis.getVoices() || [];
      availableVoices = all.filter(function (v) { return /^zh/i.test(v.lang); });
      availableVoices.sort(function (a, b) {
        return scoreVoice(b) - scoreVoice(a);
      });
      currentVoice = availableVoices[0] || null;
    }

    if (supported) {
      refreshVoices();
      global.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
    }

    function speak(text, rate, onEndCallback) {
      if (!supported || !text) return;
      var clean = text.trim();
      if (!clean) return;

      global.speechSynthesis.cancel();
      lastSpokenText = clean;

      var utter = new global.SpeechSynthesisUtterance(clean);
      utter.lang = 'zh-CN';
      // 为中文学习者量身定制：0.84 速度既自然又最容易听清 1-4 声调调值
      utter.rate = rate || 0.84;
      utter.pitch = 1.0;

      if (!currentVoice) refreshVoices();
      if (currentVoice) utter.voice = currentVoice;

      utter.onstart = function () {
        if (typeof onSpeakingChange === 'function') onSpeakingChange(true);
      };

      utter.onend = function () {
        if (typeof onSpeakingChange === 'function') onSpeakingChange(false);
        if (typeof onEndCallback === 'function') onEndCallback();
      };

      utter.onerror = function () {
        if (typeof onSpeakingChange === 'function') onSpeakingChange(false);
      };

      global.speechSynthesis.speak(utter);
    }

    function replay() {
      if (lastSpokenText) {
        speak(lastSpokenText);
      }
    }

    function stop() {
      if (supported) {
        global.speechSynthesis.cancel();
        if (typeof onSpeakingChange === 'function') onSpeakingChange(false);
      }
    }

    return {
      supported: supported,
      speak: speak,
      replay: replay,
      stop: stop,
      getVoiceName: function () {
        return currentVoice ? currentVoice.name : (supported ? '系统中文' : '不支持');
      },
      getLastSpokenText: function () {
        return lastSpokenText;
      },
      setOnSpeakingChange: function (fn) {
        onSpeakingChange = fn;
      }
    };
  })();

  global.Sound = Sound;
  global.Speech = Speech;
})(typeof globalThis !== 'undefined' ? globalThis : this);
