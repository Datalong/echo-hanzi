/* audio.js — 音效（Web Audio，零素材）与朗读（Web Speech API） */
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

  var Speech = (function () {
    var supported = typeof global.speechSynthesis !== 'undefined' &&
      typeof global.SpeechSynthesisUtterance !== 'undefined';
    var voice = null;

    function pickVoice() {
      if (!supported) return;
      var voices = global.speechSynthesis.getVoices() || [];
      voice =
        voices.filter(function (v) { return /^zh[-_]CN/i.test(v.lang); })[0] ||
        voices.filter(function (v) { return /^zh/i.test(v.lang); })[0] ||
        null;
    }

    if (supported) {
      pickVoice();
      global.speechSynthesis.addEventListener('voiceschanged', pickVoice);
    }

    return {
      supported: supported,
      speak: function (text, rate) {
        if (!supported || !text) return;
        global.speechSynthesis.cancel();
        var utter = new global.SpeechSynthesisUtterance(text);
        utter.lang = 'zh-CN';
        utter.rate = rate || 0.85;
        if (voice) utter.voice = voice;
        global.speechSynthesis.speak(utter);
      },
      stop: function () {
        if (supported) global.speechSynthesis.cancel();
      }
    };
  })();

  global.Sound = Sound;
  global.Speech = Speech;
})(typeof globalThis !== 'undefined' ? globalThis : this);
