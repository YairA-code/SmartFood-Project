// ============================================================
// Tavitly — קוד שרץ לפני הציור הראשון
// (קובץ נפרד ולא קוד בתוך ה-HTML, כדי שמדיניות האבטחה תוכל לחסום כל סקריפט מוטמע)
// ============================================================
(function () {
  // מניעת הטמעה של האתר בתוך מסגרת של אתר אחר (clickjacking)
  if (window.top !== window.self) {
    try { window.top.location = window.self.location.href; } catch (e) { document.documentElement.style.display = 'none'; }
  }

  // ערכת הנושא נקבעת מוקדם, כדי שלא יהיה הבהוב
  try {
    var t = localStorage.getItem('smart-food-theme');
    if (t !== 'dark' && t !== 'light') t = null;
    if (!t && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) t = 'dark';
    if (t) document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}

  // שפה: ?lang=en או ?lang=he בכתובת נשמרים במכשיר. באנגלית הדף עובר לכיוון שמאל-לימין
  try {
    var q = (location.search.match(/[?&]lang=(en|he)\b/) || [])[1];
    if (q) localStorage.setItem('smart-food-lang', q);
    if (localStorage.getItem('smart-food-lang') === 'en') {
      document.documentElement.setAttribute('lang', 'en');
      document.documentElement.setAttribute('dir', 'ltr');
    }
  } catch (e) {}

  // הודעה ידידותית אם משהו נכשל בטעינה
  window.addEventListener('error', function () {
    var box = document.getElementById('error-display');
    if (!box) return;
    if (document.documentElement.lang === 'en') box.textContent = 'Something went wrong while loading the page. Please refresh.';
    box.hidden = false;
  });
})();
