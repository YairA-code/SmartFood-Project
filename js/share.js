// ============================================================
// Tavitly — כרטיס שיתוף לוואטסאפ
// התמונה נוצרת בדפדפן (canvas) ולא נשלחת לשום שרת. בטלפון היא
// מצורפת דרך חלונית השיתוף של המכשיר; במחשב נפתח וואטסאפ עם טקסט
// והתמונה יורדת למכשיר.
// ============================================================

const SITE = 'https://yaira-code.github.io/SmartFood-Project/';
const W = 1080, H = 1200;
const FONT = '"Rubik", "Segoe UI", Arial, sans-serif';

function wrap(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/); const lines = []; let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// data: { name, brand, nova: { group, name, color, on, bg }, score, flags: [], alt, url }
export async function drawCard(data) {
  try { await document.fonts.load(`700 40px ${FONT}`); } catch (e) { /* הגופן החלופי מספיק */ }
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
  const R = W - 80;

  ctx.fillStyle = '#f6f7f2'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#14532d'; ctx.fillRect(0, 0, W, 150);
  ctx.fillStyle = '#ffffff'; ctx.font = `800 64px ${FONT}`; ctx.fillText('Tavitly', R, 100);
  ctx.font = `500 34px ${FONT}`; ctx.fillStyle = '#bbf7d0'; ctx.textAlign = 'left'; ctx.fillText('מה באמת יש בתווית', 80, 98); ctx.textAlign = 'right';

  let y = 250;
  ctx.fillStyle = '#111827'; ctx.font = `800 72px ${FONT}`;
  for (const l of wrap(ctx, data.name, W - 160).slice(0, 2)) { ctx.fillText(l, R, y); y += 86; }
  if (data.brand) { ctx.fillStyle = '#4b5563'; ctx.font = `500 40px ${FONT}`; ctx.fillText(data.brand, R, y); y += 40; }

  // NOVA וציון עיבוד
  y += 40;
  const n = data.nova;
  roundRect(ctx, 80, y, W - 160, 230, 36); ctx.fillStyle = n.bg; ctx.fill();
  ctx.beginPath(); ctx.arc(R - 95, y + 115, 85, 0, Math.PI * 2); ctx.fillStyle = n.color; ctx.fill();
  ctx.fillStyle = n.on; ctx.textAlign = 'center'; ctx.font = `800 110px ${FONT}`; ctx.fillText(String(n.group), R - 95, y + 153);
  ctx.textAlign = 'right'; ctx.fillStyle = '#111827';
  ctx.font = `800 52px ${FONT}`; ctx.fillText(`NOVA ${n.group}`, R - 215, y + 95);
  ctx.font = `600 40px ${FONT}`; ctx.fillText(n.name, R - 215, y + 150);
  ctx.textAlign = 'left'; ctx.font = `800 96px ${FONT}`; ctx.fillStyle = data.score >= 6 ? '#b42318' : data.score >= 3 ? '#b45309' : '#15803d';
  ctx.fillText(`${data.score}/10`, 120, y + 135);
  ctx.font = `500 30px ${FONT}`; ctx.fillStyle = '#4b5563'; ctx.fillText('ציון עיבוד', 130, y + 185);
  ctx.textAlign = 'right';
  y += 300;

  // דגלים
  ctx.font = `700 44px ${FONT}`; ctx.fillStyle = '#111827';
  if (data.flags.length) {
    for (const f of data.flags.slice(0, 3)) {
      roundRect(ctx, 80, y - 58, W - 160, 84, 24); ctx.fillStyle = '#fee2e2'; ctx.fill();
      ctx.fillStyle = '#991b1b'; ctx.fillText(`🚩 ${f}`, R - 30, y);
      y += 104;
    }
  } else {
    roundRect(ctx, 80, y - 58, W - 160, 84, 24); ctx.fillStyle = '#dcfce7'; ctx.fill();
    ctx.fillStyle = '#166534'; ctx.fillText('✅ בלי תוספים שמסומנים אצלנו כבעייתיים', R - 30, y); y += 104;
  }
  if (data.alt) {
    y += 10; ctx.fillStyle = '#14532d'; ctx.font = `600 38px ${FONT}`;
    for (const l of wrap(ctx, `חלופה מעובדת פחות: ${data.alt}`, W - 160).slice(0, 2)) { ctx.fillText(l, R, y); y += 50; }
  }

  ctx.fillStyle = '#6b7280'; ctx.font = `500 28px ${FONT}`;
  ctx.fillText('לפי רשימת הרכיבים · מידע כללי ולא ייעוץ תזונתי', R, H - 105);
  ctx.fillStyle = '#14532d'; ctx.font = `700 34px ${FONT}`; ctx.direction = 'ltr'; ctx.textAlign = 'left';
  ctx.fillText(SITE.replace('https://', '').replace(/\/$/, ''), 80, H - 55);
  return new Promise(res => c.toBlob(res, 'image/png'));
}

export function shareText(data) {
  const parts = [`${data.name}: NOVA ${data.nova.group} (${data.nova.name}), ציון עיבוד ${data.score}/10.`];
  if (data.flags.length) parts.push(data.flags.join(' · ') + '.');
  if (data.alt) parts.push(`חלופה מעובדת פחות: ${data.alt}.`);
  parts.push(`לפרטים: ${data.url || SITE}`);
  return parts.join(' ');
}

export async function shareCard(data) {
  const text = shareText(data);
  const blob = await drawCard(data);
  const file = blob && new File([blob], 'tavitly.png', { type: 'image/png' });
  if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text }); return 'shared'; }
    catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  }
  // במחשב: הורדת התמונה ופתיחת וואטסאפ עם הטקסט
  if (blob) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'tavitly.png';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
  return 'fallback';
}

export const SITE_URL = SITE;
