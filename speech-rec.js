/* speech-rec.js — Web Speech Recognition 实时普通话语音识别与发音对齐评分
 * 纯前端原生，对比用户口语发音转录与目标汉字，逐字打分标色
 */
(function (global) {
  'use strict';

  var SpeechRecognition = global.SpeechRecognition || global.webkitSpeechRecognition;

  var Engine = (function () {
    var supported = !!SpeechRecognition;
    var recognition = null;
    var isListening = false;
    var targetSentence = '';
    var onTranscriptCallback = null;
    var onResultCallback = null;
    var onErrorCallback = null;
    var onStateChangeCallback = null;

    if (supported) {
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'zh-CN';
        recognition.maxAlternatives = 1;

        recognition.onstart = function () {
          isListening = true;
          if (typeof onStateChangeCallback === 'function') onStateChangeCallback(true);
        };

        recognition.onresult = function (event) {
          var transcript = '';
          for (var i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          if (typeof onTranscriptCallback === 'function') {
            onTranscriptCallback(transcript);
          }

          var isFinal = event.results[event.results.length - 1].isFinal;
          if (isFinal) {
            var scoreResult = evaluatePronunciation(targetSentence, transcript);
            if (typeof onResultCallback === 'function') {
              onResultCallback(scoreResult);
            }
          }
        };

        recognition.onerror = function (event) {
          isListening = false;
          if (typeof onStateChangeCallback === 'function') onStateChangeCallback(false);
          if (typeof onErrorCallback === 'function') {
            onErrorCallback(event.error || 'Speech recognition error');
          }
        };

        recognition.onend = function () {
          isListening = false;
          if (typeof onStateChangeCallback === 'function') onStateChangeCallback(false);
        };
      } catch (e) {
        supported = false;
      }
    }

    /**
     * 智能对齐：对比目标汉字与转录文本，逐字标出正确/错误，并给出百分制评分
     */
    function evaluatePronunciation(target, spoken) {
      var tClean = (target || '').replace(/[，。！？：；、“”\s,.!?]/g, '');
      var sClean = (spoken || '').replace(/[，。！？：；、“”\s,.!?]/g, '');

      var tChars = Array.from(tClean);
      var sChars = Array.from(sClean);

      var matched = 0;
      var charStatuses = []; // Array<{ ch: string, status: 'ok'|'err' }>

      var sIndex = 0;
      for (var i = 0; i < tChars.length; i++) {
        var ch = tChars[i];
        // 如果在 spoken 中相应位置或附近匹配到该汉字
        var foundIdx = -1;
        for (var j = sIndex; j < Math.min(sIndex + 3, sChars.length); j++) {
          if (sChars[j] === ch) {
            foundIdx = j;
            break;
          }
        }

        if (foundIdx !== -1) {
          matched++;
          sIndex = foundIdx + 1;
          charStatuses.push({ ch: ch, status: 'ok' });
        } else {
          charStatuses.push({ ch: ch, status: 'err' });
        }
      }

      var total = Math.max(1, tChars.length);
      var accuracy = Math.round((matched / total) * 100);

      return {
        target: target,
        spoken: spoken,
        charStatuses: charStatuses,
        accuracy: accuracy,
        isPerfect: accuracy >= 90
      };
    }

    function startListening(target) {
      if (!supported || !recognition) return false;
      targetSentence = target || '';
      try {
        recognition.start();
        return true;
      } catch (e) {
        // 如果正在运行先停再开
        try { recognition.stop(); } catch (err) {}
        setTimeout(function () {
          try { recognition.start(); } catch (err2) {}
        }, 100);
        return true;
      }
    }

    function stopListening() {
      if (!supported || !recognition) return;
      try { recognition.stop(); } catch (e) {}
    }

    return {
      isSupported: function () { return supported; },
      isListening: function () { return isListening; },
      startListening: startListening,
      stopListening: stopListening,
      evaluatePronunciation: evaluatePronunciation,
      setCallbacks: function (cbs) {
        if (cbs.onTranscript) onTranscriptCallback = cbs.onTranscript;
        if (cbs.onResult) onResultCallback = cbs.onResult;
        if (cbs.onError) onErrorCallback = cbs.onError;
        if (cbs.onStateChange) onStateChangeCallback = cbs.onStateChange;
      }
    };
  })();

  global.SpeechRec = Engine;
})(typeof globalThis !== 'undefined' ? globalThis : this);
