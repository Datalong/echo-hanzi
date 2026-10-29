/* tutor.js — AI 助教 (AI Tutor)
 *
 * 知道你的学习上下文（SRS 到期、弱项、收藏、最近成绩），
 * 通过 OpenAI 兼容的 /chat/completions 接口对话辅导。
 * 用户自带 API Key（BYOK），支持自定义 baseURL（DeepSeek / Moonshot / Ollama 等）。
 */
(function (global) {
  'use strict';

  var SETTINGS_KEY = 'echo-hanzi:tutor:settings:v1';
  var HISTORY_KEY = 'echo-hanzi:tutor:history:v1';
  var MAX_HISTORY = 40;

  var DEFAULT_SETTINGS = {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini'
  };

  var SYSTEM_PROMPT = [
    '你是 Echo Hanzi 的中文学习助教，面向 HSK 1-2 起步的中文学习者。',
    '规则：',
    '1. 默认用学习者的界面语言解释，但教学目标词句始终给出汉字 + 拼音（带声调）。',
    '2. 回答简短、口语化，一次只讲一个知识点，多用例子。',
    '3. 主动利用「学习上下文」：优先围绕学生的弱项和待复习词出题、纠错。',
    '4. 学生答对要鼓励，答错给出最小修正并示范正确说法。',
    '5. 不要一次性输出长表格或长清单。'
  ].join('\n');

  /* ---------------- 设置 ---------------- */

  function loadSettings() {
    var s = {};
    try {
      s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') || {};
    } catch (err) { s = {}; }
    return {
      baseUrl: s.baseUrl || DEFAULT_SETTINGS.baseUrl,
      apiKey: s.apiKey || '',
      model: s.model || DEFAULT_SETTINGS.model
    };
  }

  function saveSettings(s) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    } catch (err) { /* ignore */ }
  }

  /* ---------------- 历史记录 ---------------- */

  function loadHistory() {
    try {
      var h = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      return Array.isArray(h) ? h.slice(-MAX_HISTORY) : [];
    } catch (err) { return []; }
  }

  function saveHistory(list) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(-MAX_HISTORY)));
    } catch (err) { /* ignore */ }
  }

  function clearHistory() {
    try { localStorage.removeItem(HISTORY_KEY); } catch (err) { /* ignore */ }
  }

  /* ---------------- 学习上下文 ---------------- */

  /** 汇总学习状态，拼成给模型看的短上下文 */
  function buildContext() {
    var lines = [];

    if (global.Stats) {
      var db = global.Stats.load();
      var sum = global.Stats.summary(db);
      if (sum.sessions > 0) {
        lines.push('累计练习 ' + sum.sessions + ' 轮，平均 CPM ' + sum.avgCpm +
          '，平均正确率 ' + sum.avgAcc + '%');
      }
      var weak = global.Stats.rank(db.initials, 3).slice(0, 3)
        .concat(global.Stats.rank(db.finals, 3).slice(0, 3));
      weak = weak.filter(function (r) { return r.rate >= 0.12 && r.errors >= 3; })
        .slice(0, 5);
      if (weak.length) {
        lines.push('弱项：' + weak.map(function (r) {
          return r.key + '(' + Math.round(r.rate * 100) + '% 错误率)';
        }).join('、'));
      }
    }

    if (global.Srs) {
      var srsDb = global.Srs.load();
      var pool = (global.WORD_LISTS && global.WORD_LISTS.all || []);
      if (global.SENTENCE_LISTS) pool = pool.concat(global.SENTENCE_LISTS.all || []);
      var due = global.Srs.dueItems(srsDb, pool).slice(0, 10);
      if (due.length) {
        lines.push('待复习：' + due.map(function (e) { return e.item.hanzi; }).join('、'));
      }
      var st = global.Srs.stats(srsDb, pool);
      lines.push('记忆状态：学习中 ' + st.learning + '，已掌握 ' + st.mastered);
    }

    if (global.Collection) {
      var favs = global.Collection.recent(10);
      if (favs.length) lines.push('学生收藏的生字：' + favs.join('、'));
    }

    return lines.length ? lines.join('\n') : '学生刚开始学习，还没有数据。';
  }

  /* ---------------- 对话 ---------------- */

  function isConfigured() {
    return !!loadSettings().apiKey;
  }

  /**
   * 发起对话（流式）
   * @param {Array<{role,content}>} msgs 完整消息列表（含新用户消息）
   * @param {(delta:string)=>void} onDelta 增量回调
   * @returns {Promise<string>} 完整回复
   */
  function chat(msgs, onDelta) {
    var s = loadSettings();
    if (!s.apiKey) return Promise.reject(new Error('NO_API_KEY'));

    var body = {
      model: s.model,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + '\n\n[学习上下文]\n' + buildContext() }
      ].concat(msgs.slice(-12))
    };

    return fetch(s.baseUrl.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + s.apiKey
      },
      body: JSON.stringify(body)
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (txt) {
          throw new Error('HTTP ' + res.status + (txt ? ': ' + txt.slice(0, 200) : ''));
        });
      }
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buf = '';
      var full = '';

      function pump() {
        return reader.read().then(function (chunk) {
          if (chunk.done) return full;
          buf += decoder.decode(chunk.value, { stream: true });
          var rows = buf.split('\n');
          buf = rows.pop();
          rows.forEach(function (row) {
            row = row.trim();
            if (row.indexOf('data:') !== 0) return;
            var payload = row.slice(5).trim();
            if (payload === '[DONE]') return;
            try {
              var json = JSON.parse(payload);
              var delta = json.choices && json.choices[0] &&
                json.choices[0].delta && json.choices[0].delta.content;
              if (delta) {
                full += delta;
                if (onDelta) onDelta(delta);
              }
            } catch (err) { /* 忽略心跳/非 JSON 行 */ }
          });
          return pump();
        });
      }
      return pump();
    });
  }

  var api = {
    SETTINGS_KEY: SETTINGS_KEY,
    HISTORY_KEY: HISTORY_KEY,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    SYSTEM_PROMPT: SYSTEM_PROMPT,
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    loadHistory: loadHistory,
    saveHistory: saveHistory,
    clearHistory: clearHistory,
    buildContext: buildContext,
    isConfigured: isConfigured,
    chat: chat
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Tutor = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
