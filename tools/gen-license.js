#!/usr/bin/env node
/* tools/gen-license.js — Echo Hanzi License 签发工具（仅构建期使用，不进浏览器）
 *
 * 用法：
 *   node tools/gen-license.js genkeys            首次生成密钥对（keys/ 下）
 *   node tools/gen-license.js issue <id> [--days N]   签发一个永久/限时 Pro key
 *
 * 私钥只保存在本地 keys/private.pem（已 gitignore），绝不提交。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const KEYS_DIR = path.join(ROOT, 'keys');
const PRIV = path.join(KEYS_DIR, 'private.pem');
const PUB = path.join(KEYS_DIR, 'public.hex');

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function genkeys() {
  fs.mkdirSync(KEYS_DIR, { recursive: true });
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  fs.writeFileSync(PRIV, privateKey.export({ type: 'pkcs8', format: 'pem' }));
  const raw = publicKey.export({ type: 'spki', format: 'der' });
  // SPKI DER 的最后 32 字节是 raw Ed25519 公钥
  const rawHex = raw.subarray(raw.length - 32).toString('hex');
  fs.writeFileSync(PUB, rawHex + '\n');
  console.log('✅ 密钥对已生成');
  console.log('   公钥(hex，需同步到 license.js):', rawHex);
  console.log('   私钥:', PRIV, '(已 gitignore，勿提交)');
}

function issue(id, days) {
  if (!fs.existsSync(PRIV)) {
    console.error('❌ 没有私钥，先运行: node tools/gen-license.js genkeys');
    process.exit(1);
  }
  const payload = { v: 1, id, tier: 'pro', iat: Date.now() };
  if (days) payload.exp = Date.now() + days * 864e5;
  const payloadB64 = b64url(JSON.stringify(payload));
  const signature = crypto.sign(null, Buffer.from(payloadB64), fs.readFileSync(PRIV));
  const key = 'EH1.' + payloadB64 + '.' + b64url(signature);
  console.log('License Key for', id + ':');
  console.log(key);
}

const [cmd, arg, flag, flagVal] = process.argv.slice(2);
if (cmd === 'genkeys') return genkeys();
if (cmd === 'issue' && arg) return issue(arg, flag === '--days' ? parseInt(flagVal, 10) : 0);
console.log('用法:\n  node tools/gen-license.js genkeys\n  node tools/gen-license.js issue <id> [--days N]');
