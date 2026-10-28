/* share.js — 成绩战绩海报绘制与分享引擎 (纯前端 Canvas 1200x675 Retina)
 * 零第三方依赖，一键生成精美社交分享打卡海报
 */
(function (global) {
  'use strict';

  function createResultCard(data) {
    var canvas = document.createElement('canvas');
    var w = 1200;
    var h = 675;
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;

    var isZh = data.lang !== 'en';

    // 1. 背景与环境光
    var bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0d0f14');
    bgGrad.addColorStop(1, '#161b26');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 氛围光晕 (Radials)
    var rad1 = ctx.createRadialGradient(200, 100, 20, 200, 100, 480);
    rad1.addColorStop(0, 'rgba(94, 233, 181, 0.15)');
    rad1.addColorStop(1, 'transparent');
    ctx.fillStyle = rad1;
    ctx.fillRect(0, 0, w, h);

    var rad2 = ctx.createRadialGradient(1000, 550, 40, 1000, 550, 450);
    rad2.addColorStop(0, 'rgba(106, 169, 255, 0.12)');
    rad2.addColorStop(1, 'transparent');
    ctx.fillStyle = rad2;
    ctx.fillRect(0, 0, w, h);

    // 外边框微光
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, w - 60, h - 60);

    // 2. 品牌与模式头部
    ctx.fillStyle = '#5ee9b5';
    ctx.beginPath();
    ctx.arc(75, 75, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('Echo Hanzi', 95, 83);

    ctx.fillStyle = '#8b94a7';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('· ' + (isZh ? '中文打字学习' : 'Learn Chinese through typing'), 245, 83);

    // 模式胶囊
    var modeBadgeText = (data.modeName || 'HSK 1') + (data.level ? ' · ' + data.level : '');
    ctx.font = '14px -apple-system, sans-serif';
    var badgeWidth = ctx.measureText(modeBadgeText).width + 24;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(w - 75 - badgeWidth, 60, badgeWidth, 32, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#6aa9ff';
    ctx.fillText(modeBadgeText, w - 75 - badgeWidth + 12, 81);

    // 3. 核心大指标区 (CPM 英雄数据)
    var cpmGrad = ctx.createLinearGradient(75, 180, 75, 280);
    cpmGrad.addColorStop(0, '#5ee9b5');
    cpmGrad.addColorStop(1, '#6aa9ff');
    ctx.fillStyle = cpmGrad;
    ctx.font = 'bold 110px ui-monospace, "SF Mono", "JetBrains Mono", Menlo, sans-serif';
    ctx.fillText(String(data.cpm || 0), 75, 250);

    ctx.fillStyle = '#8b94a7';
    ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(isZh ? '字符 / 分 (CPM)' : 'Characters / Min (CPM)', 80, 290);

    // 三格副指标 (正确率, 连击, 完成词数)
    var statsLeft = 520;
    var statsY = 180;
    var statsItems = [
      { k: isZh ? '正确率' : 'Accuracy', v: (data.acc || 100) + '%' },
      { k: isZh ? '最长连击' : 'Best Streak', v: String(data.streak || 0) },
      { k: isZh ? '完成' : 'Completed', v: String(data.words || 0) + (isZh ? ' 题' : ' items') },
      { k: isZh ? '用时' : 'Time', v: data.time || '0:00' }
    ];

    statsItems.forEach(function (st, idx) {
      var col = idx % 2;
      var row = Math.floor(idx / 2);
      var bx = statsLeft + col * 280;
      var by = statsY + row * 65;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px ui-monospace, "SF Mono", Menlo, sans-serif';
      ctx.fillText(st.v, bx, by);

      ctx.fillStyle = '#8b94a7';
      ctx.font = '13px -apple-system, sans-serif';
      ctx.fillText(st.k, bx, by + 22);
    });

    // 4. 分割虚线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(75, 345);
    ctx.lineTo(w - 75, 345);
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. 汉字战绩成果方阵 (Hanzi Showcase Grid)
    ctx.fillStyle = '#8b94a7';
    ctx.font = '14px -apple-system, sans-serif';
    ctx.fillText(isZh ? '本轮掌握的汉字成果' : 'Characters & Vocabulary Practiced', 75, 385);

    var sampleChars = data.characters || ['学', '中', '文', '打', '字', '练', '习', '好', '快', '乐'];
    var maxShow = Math.min(22, sampleChars.length);
    var startX = 75;
    var curX = startX;
    var curY = 460;
    var cellSize = 42;
    var gap = 14;

    for (var i = 0; i < maxShow; i++) {
      var ch = sampleChars[i];
      // 汉字印章背景框
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(94, 233, 181, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(curX, curY - 36, cellSize, cellSize, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#e8ebf2';
      ctx.font = '24px "Songti SC", "Noto Serif SC", serif';
      ctx.textAlign = 'center';
      ctx.fillText(ch, curX + cellSize / 2, curY - 7);
      ctx.textAlign = 'left';

      curX += cellSize + gap;
      if (curX + cellSize > w - 75 && i < maxShow - 1) {
        curX = startX;
        curY += cellSize + 12;
      }
    }

    // 6. 底部水印与印章
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.font = '13px ui-monospace, "SF Mono", Menlo, sans-serif';
    ctx.fillText('echo-hanzi.app · Practice Chinese through typing muscle memory', 75, h - 50);

    var today = new Date().toISOString().slice(0, 10);
    ctx.textAlign = 'right';
    ctx.fillText(today, w - 75, h - 50);
    ctx.textAlign = 'left';

    return canvas;
  }

  /**
   * 触发下载图片
   */
  function downloadCard(canvas, filename) {
    if (!canvas) return;
    var link = document.createElement('a');
    link.download = filename || 'echo-hanzi-result.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  /**
   * 复制图片到剪贴板 (Clipboard API)
   */
  function copyCardToClipboard(canvas, onSuccess, onError) {
    if (!canvas || !canvas.toBlob || !navigator.clipboard || !navigator.clipboard.write) {
      if (typeof onError === 'function') onError('Clipboard API not supported');
      return;
    }
    canvas.toBlob(function (blob) {
      if (!blob) {
        if (typeof onError === 'function') onError('Blob conversion failed');
        return;
      }
      try {
        var item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(function () {
          if (typeof onSuccess === 'function') onSuccess();
        }).catch(function (err) {
          if (typeof onError === 'function') onError(err);
        });
      } catch (e) {
        if (typeof onError === 'function') onError(e);
      }
    }, 'image/png');
  }

  var api = {
    createResultCard: createResultCard,
    downloadCard: downloadCard,
    copyCardToClipboard: copyCardToClipboard
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Share = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
