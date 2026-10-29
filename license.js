/* license.js — Pro 授权（License Key 离线验证）
 *
 * 格式：EH1.<payloadB64url>.<sigB64url>
 * payload: { v, id, tier, iat, exp? }
 * 验证：Ed25519（WebCrypto），公钥内置于下方，私钥只在签发者手中。
 * 激活状态存 localStorage，每次启动重新验签（可检测过期）。
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'echo-hanzi:license:v1';
  var PUBLIC_KEY_HEX = 'd99cafbeb553c5d945e2ee0d2e422ce01c9da96b75d762a1e9125d5043b72a5f';

  // ---- Free/Pro 配额 ----
  var QUOTA = {
    tutorDaily: 5,       // AI 助教每日消息（Free）
    pronDaily: 10,       // 发音听辨每日题（Free）
    customImports: 1     // 自定义内容套数（Free）
  };

  function b64uToBytes(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function bytesToB64u(bytes) {
    var bin = '';
    new Uint8Array(bytes).forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function hexToBytes(hex) {
    var out = new Uint8Array(hex.length / 2);
    for (var i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }

  function subtle() {
    return global.crypto && global.crypto.subtle;
  }

  /** 验证 key，返回 Promise<{ok, payload?, reason?}> */
  function verifyKey(key) {
    if (!key || key.indexOf('EH1.') !== 0) return Promise.resolve({ ok: false, reason: 'FORMAT' });
    var parts = key.split('.');
    if (parts.length !== 3) return Promise.resolve({ ok: false, reason: 'FORMAT' });
    var payloadB64 = parts[1];
    var sig = b64uToBytes(parts[2]);
    var payload;
    try {
      payload = JSON.parse(new TextDecoder().decode(b64uToBytes(payloadB64)));
    } catch (err) {
      return Promise.resolve({ ok: false, reason: 'FORMAT' });
    }
    if (!subtle()) return Promise.resolve({ ok: false, reason: 'UNSUPPORTED' });

    return subtle().importKey('raw', hexToBytes(PUBLIC_KEY_HEX), { name: 'Ed25519' }, false, ['verify'])
      .then(function (pubKey) {
        return subtle().verify({ name: 'Ed25519' }, pubKey, sig, new TextEncoder().encode(payloadB64));
      })
      .then(function (valid) {
        if (!valid) return { ok: false, reason: 'SIGNATURE' };
        if (payload.exp && Date.now() > payload.exp) return { ok: false, reason: 'EXPIRED' };
        return { ok: true, payload: payload };
      })
      .catch(function () {
        return { ok: false, reason: 'UNSUPPORTED' };
      });
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (err) { return null; }
  }

  function save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) { /* ignore */ }
  }

  /** 激活：验签通过才落盘，返回 Promise<{ok, reason?, payload?}> */
  function activate(key) {
    return verifyKey((key || '').trim()).then(function (res) {
      if (!res.ok) return res;
      save({ key: key.trim(), tier: res.payload.tier, id: res.payload.id, activatedAt: Date.now() });
      return res;
    });
  }

  function deactivate() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
  }

  /** 是否 Pro：有已验证的激活记录（exp 在启动时由 verifyKey 拦截，此处再查一次） */
  function isPro() {
    var state = load();
    if (!state || !state.key) return false;
    try {
      var payload = JSON.parse(new TextDecoder().decode(b64uToBytes(state.key.split('.')[1])));
      if (payload.exp && Date.now() > payload.exp) return false;
      return payload.tier === 'pro';
    } catch (err) { return false; }
  }

  /* ---- 每日配额（Free 限制用） ---- */

  function quotaKey(name) { return 'echo-hanzi:quota:' + name; }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  /** 取今日已用量 */
  function quotaUsed(name) {
    try {
      var rec = JSON.parse(localStorage.getItem(quotaKey(name)) || 'null');
      return rec && rec.day === todayStr() ? rec.n : 0;
    } catch (err) { return 0; }
  }

  /** 今日用量 +1，返回累加后的值 */
  function quotaBump(name) {
    var n = quotaUsed(name) + 1;
    try { localStorage.setItem(quotaKey(name), JSON.stringify({ day: todayStr(), n: n })); } catch (err) { /* ignore */ }
    return n;
  }

  /**
   * 配额闸门：Pro 直接放行；Free 检查额度。
   * @returns {boolean} true=允许使用
   */
  function allow(name) {
    if (isPro()) return true;
    return quotaUsed(name) < (QUOTA[name] || Infinity);
  }

  var api = {
    STORAGE_KEY: STORAGE_KEY,
    QUOTA: QUOTA,
    verifyKey: verifyKey,
    load: load,
    activate: activate,
    deactivate: deactivate,
    isPro: isPro,
    quotaUsed: quotaUsed,
    quotaBump: quotaBump,
    allow: allow
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.License = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
