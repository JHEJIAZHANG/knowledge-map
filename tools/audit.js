// 掃過所有短片的每個鏡頭，找出：文字超出自己的框、超出舞台、文字互相重疊
window.auditFilms = async function () {
  const KM = window.KnowledgeMap;
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:0;top:0;width:960px;height:480px;z-index:-1;opacity:0.01;pointer-events:none';
  document.body.append(box);
  const vis = (n, stage) => { for (let e = n; e && e !== stage; e = e.parentNode) { const o = e.getAttribute('opacity'); if (o !== null && +o < 0.15) return false; if (getComputedStyle(e).opacity < 0.15) return false; } return true; };
  const R = (r) => ({ l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom) });
  const out = [];
  for (const id of Object.keys(KM.Movie.films)) {
    let m;
    try { m = new KM.Movie({ film: id }); } catch (e) { out.push(`${id}: 建立失敗 ${e.message}`); continue; }
    m.stage.style.cssText = 'width:960px;height:480px;display:block';
    box.replaceChildren(m.stage);
    const seen = new Set();
    for (let k = 0; k < m.shots.length; k++) {
      try { await m.seek(k); } catch (e) { out.push(`${id}#${k}: 播放失敗 ${e.message}`); continue; }
      const last = k === m.shots.length - 1;
      const texts = [...m.stage.querySelectorAll('text')].filter((t) => t.textContent.trim() && vis(t, m.stage) && (last ? t.closest('.f-memo-g') : !t.closest('.f-memo-g')));
      const rects = texts.map((t) => t.getBoundingClientRect());
      texts.forEach((t, i) => {
        const r = rects[i];
        const say = (kind, extra) => { const key = `${kind}|${t.textContent}`; if (seen.has(key)) return; seen.add(key); out.push(`${id}#${k + 1} ${kind}「${t.textContent}」${extra}`); };
        if (r.left < 4 || r.right > 956 || r.top < 2 || r.bottom > 478) say('超出舞台', JSON.stringify(R(r)));
        const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
        const holders = [...m.stage.querySelectorAll('rect, ellipse')].filter((c) => (last ? c.classList.contains('f-memo') : true) && !c.classList.contains('f-veil') && !c.classList.contains('f-ring') && vis(c, m.stage))
          .map((c) => c.getBoundingClientRect()).filter((b) => b.left <= cx && b.right >= cx && b.top <= cy && b.bottom >= cy && b.height >= r.height * 0.8 && b.width < 940)
          .sort((p, q) => p.width * p.height - q.width * q.height);
        if (holders.length) {
          const big = holders[0];
          const pad = Math.min(r.left - big.left, big.right - r.right);
          if (pad < (window.auditPad || 10)) say('超出框', '左右留白 ' + Math.round(pad) + '，字寬 ' + Math.round(r.width) + ' 框 ' + Math.round(big.width));
        }
        for (let j = i + 1; j < texts.length; j++) {
          const q = rects[j];
          const ox = Math.min(r.right, q.right) - Math.max(r.left, q.left);
          const oy = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top);
          if (ox > 6 && oy > 8) say('文字重疊', `和「${texts[j].textContent}」`);
        }
      });
    }
    m.destroy && m.destroy();
  }
  box.remove();
  return out;
};
