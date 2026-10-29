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

  /* ---------------- 🎙️ 录音回放（对比示范音用） ----------------
   * 与识别引擎并行：getUserMedia + MediaRecorder 独立录音，
   * 停止后返回可回放的 blob URL，用于「我的录音 vs 示范音」A/B 对比。 */
  var recorder = null;
  var recChunks = [];
  var recStream = null;

  function startRecording() {
    if (!global.navigator || !navigator.mediaDevices || !global.MediaRecorder) {
      return Promise.resolve(false);
    }
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      recStream = stream;
      recChunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = function (e) { if (e.data && e.data.size) recChunks.push(e.data); };
      recorder.start();
      return true;
    }).catch(function () { return false; });
  }

  /** 停止录音，回调拿到回放 URL（失败传 null） */
  function stopRecording(cb) {
    if (!recorder || recorder.state === 'inactive') {
      if (cb) cb(null);
      return;
    }
    recorder.onstop = function () {
      var url = null;
      try {
        url = URL.createObjectURL(new Blob(recChunks, { type: recorder.mimeType || 'audio/webm' }));
      } catch (err) { /* ignore */ }
      if (recStream) recStream.getTracks().forEach(function (t) { t.stop(); });
      recStream = null;
      recorder = null;
      if (cb) cb(url);
    };
    try { recorder.stop(); } catch (err) { if (cb) cb(null); }
  }

  /* ---------------- 🎤 自由听写（AI 助教语音输入用） ----------------
   * 与目标句引擎独立的识别实例：转写最终结果回调，无评分目标。 */
  var dictationRec = null;
  var dictating = false;

  function startDictation(onText, onEnd) {
    if (!supported || dictating) return false;
    try {
      dictationRec = new SpeechRecognition();
      dictationRec.continuous = false;
      dictationRec.interimResults = true;
      dictationRec.lang = 'zh-CN';
    } catch (err) { return false; }
    dictating = true;
    dictationRec.onresult = function (event) {
      var text = '';
      for (var i = 0; i < event.results.length; i++) text += event.results[i][0].transcript;
      if (onText) onText(text);
    };
    dictationRec.onerror = function () { dictating = false; if (onEnd) onEnd(); };
    dictationRec.onend = function () { dictating = false; if (onEnd) onEnd(); };
    try {
      dictationRec.start();
      return true;
    } catch (err) {
      dictating = false;
      return false;
    }
  }

  function stopDictation() {
    if (dictationRec) { try { dictationRec.stop(); } catch (err) {} }
  }

  function isDictating() { return dictating; }

  Engine.startRecording = startRecording;
  Engine.stopRecording = stopRecording;
  Engine.startDictation = startDictation;
  Engine.stopDictation = stopDictation;
  Engine.isDictating = isDictating;
})(typeof globalThis !== 'undefined' ? globalThis : this);
