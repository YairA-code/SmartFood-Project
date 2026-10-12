// ============================================================
// Smart Food — פונקציות עזר
// ============================================================

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// הגנה מ-XSS בהצגת טקסט
export function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// כתובת הקשר מורכבת רק בדפדפן, כדי שרובוטים שאוספים כתובות מקוד המקור לא ימצאו אותה
const CONTACT = ['yairavr57', ['gmail', 'com'].join('.')];
export function fillContactLinks(root = document) {
  root.querySelectorAll('[data-mail]').forEach(a => {
    const m = CONTACT.join('@');
    a.href = 'mailto:' + m;
    a.textContent = m;
  });
}
