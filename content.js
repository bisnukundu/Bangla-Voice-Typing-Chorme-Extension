// বাংলা ভয়েস টাইপিং — Content Script v4
// Features: real-time typing, active box highlight, theme, auto punctuation

(function () {
  if (document.getElementById('bvt-root')) return;

  // ─── Themes ────────────────────────────────────────────────────
  const THEMES = {
    dark: { bg: '#0a0a0f', surface: '#141420', border: 'rgba(255,255,255,0.09)', text: '#e8e8f0', sub: 'rgba(255,255,255,0.35)', accent: '#4f7df3', accentB: '#7b5ea7', mic: '#1a1a2e', micB: '#2d2d44' },
    midnight: { bg: '#0d1117', surface: '#161b22', border: 'rgba(255,255,255,0.08)', text: '#c9d1d9', sub: 'rgba(255,255,255,0.3)', accent: '#58a6ff', accentB: '#bc8cff', mic: '#161b22', micB: '#21262d' },
    ocean: { bg: '#0a1628', surface: '#0e2040', border: 'rgba(100,180,255,0.15)', text: '#b8d4f0', sub: 'rgba(184,212,240,0.35)', accent: '#38bdf8', accentB: '#818cf8', mic: '#0e2040', micB: '#163058' },
    forest: { bg: '#0a1a0f', surface: '#122818', border: 'rgba(100,200,120,0.15)', text: '#b8d4bc', sub: 'rgba(184,212,188,0.35)', accent: '#4ade80', accentB: '#34d399', mic: '#122818', micB: '#1a3820' },
    sunset: { bg: '#1a0a0f', surface: '#2d1020', border: 'rgba(255,100,100,0.15)', text: '#f0c8d0', sub: 'rgba(240,200,208,0.35)', accent: '#f87171', accentB: '#fb923c', mic: '#2d1020', micB: '#3d1830' },
    light: { bg: '#f0f0f5', surface: '#ffffff', border: 'rgba(0,0,0,0.1)', text: '#1a1a2e', sub: 'rgba(0,0,0,0.4)', accent: '#4f7df3', accentB: '#7b5ea7', mic: '#e0e0f0', micB: '#d0d0e8' }
  };

  // ─── State ─────────────────────────────────────────────────────
  let settings = {
    autoPunct: true,
    highlight: true,
    collapsed: false
  };

  let recognition = null;
  let isListening = false;
  let currentLang = 'bn-BD';
  let activeInput = null;

  // ─── Punctuation auto-add ──────────────────────
  const BN_SENTENCE_ENDERS = ['করুন', 'হয়', 'আছে', 'ছিল', 'হবে', 'দিন', 'নিন', 'যান', 'আসুন', 'বলুন', 'দেখুন', 'পড়ুন', 'লিখুন', 'শুনুন', 'জানুন', 'বুঝুন', 'ভালো', 'ধন্যবাদ', 'শুভেচ্ছা'];
  const BN_QUESTION_WORDS = ['কি', 'কী', 'কেন', 'কোথায়', 'কখন', 'কিভাবে', 'কীভাবে', 'কে', 'কার', 'কাকে', 'কাদের', 'কোন', 'কতটুকু', 'কতজন'];

  function autoPunctuate(text, lang) {
    if (!settings.autoPunct) return text;
    let t = text.trim();
    if (!t) return text;

    if (lang === 'bn-BD') {
      const lastWord = t.split(/\s+/).pop().replace(/[।,?!]/g, '');
      const firstWord = t.split(/\s+/)[0].replace(/[।,?!]/g, '');
      const hasPunct = /[।,?!]$/.test(t);

      if (!hasPunct) {
        if (BN_QUESTION_WORDS.includes(firstWord) || t.endsWith('?') || /\?/.test(t)) {
          t += '?';
        } else if (BN_SENTENCE_ENDERS.includes(lastWord) || t.length > 15) {
          t += '।';
        }
      }
    } else {
      if (!/[.?!,]$/.test(t) && t.split(' ').length > 3) {
        t += '.';
      }
    }
    return t;
  }

  // ─── Build Widget HTML ────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'bvt-root';
  root.innerHTML = `
    <style id="bvt-theme-style"></style>
    <div id="bvt-widget">
      <div id="bvt-controls">
        <div id="bvt-drag-handle">⠿</div>
        <div style="display:flex; gap:6px;">
          <div id="bvt-emoji-btn" title="ইমোজি">😊</div>
          <div id="bvt-minimize" title="ছোট করুন">−</div>
        </div>
      </div>

      <div id="bvt-lang-toggle">
        <button class="bvt-lang" data-lang="bn-BD">বাং</button>
        <button class="bvt-lang" data-lang="en-US">ENG</button>
      </div>

      <button id="bvt-mic">
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor"/>
          <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
        <div id="bvt-ring"></div>
      </button>

      <div id="bvt-status">ক্লিক করুন</div>

      <!-- Translate Button -->
      <button id="bvt-translate-btn" title="অনুবাদ করুন">
        <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
          <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" fill="currentColor"/>
        </svg>
        <span>অনুবাদ</span>
      </button>

      <!-- Translate Panel -->
      <div id="bvt-translate-panel">
        <div id="bvt-tl-header">
          <select id="bvt-tl-from" title="সোর্স ভাষা">
            <option value="auto">স্বয়ংক্রিয়</option>
            <option value="bn">বাংলা</option>
            <option value="en">ইংরেজি</option>
            <option value="hi">হিন্দি</option>
            <option value="ar">আরবি</option>
            <option value="zh-CN">চীনা (সরল)</option>
            <option value="fr">ফরাসি</option>
            <option value="de">জার্মান</option>
            <option value="es">স্প্যানিশ</option>
            <option value="pt">পর্তুগিজ</option>
            <option value="ru">রুশিয়ান</option>
            <option value="ja">জাপানি</option>
            <option value="ko">কোরিয়ান</option>
            <option value="tr">তুর্কি</option>
            <option value="it">ইতালিয়ান</option>
            <option value="ur">উর্দু</option>
            <option value="fa">ফারসি</option>
            <option value="ms">মালায়</option>
            <option value="id">ইন্দোনেশিয়ান</option>
            <option value="nl">ডাচ</option>
            <option value="th">থাই</option>
          </select>
          <button id="bvt-tl-swap" title="ভাষা বদলান">⇄</button>
          <select id="bvt-tl-to" title="টার্গেট ভাষা">
            <option value="bn">বাংলা</option>
            <option value="en">ইংরেজি</option>
            <option value="hi">হিন্দি</option>
            <option value="ar">আরবি</option>
            <option value="zh-CN">চীনা (সরল)</option>
            <option value="fr">ফরাসি</option>
            <option value="de">জার্মান</option>
            <option value="es">স্প্যানিশ</option>
            <option value="pt">পর্তুগিজ</option>
            <option value="ru">রুশিয়ান</option>
            <option value="ja">জাপানি</option>
            <option value="ko">কোরিয়ান</option>
            <option value="tr">তুর্কি</option>
            <option value="it">ইতালিয়ান</option>
            <option value="ur">উর্দু</option>
            <option value="fa">ফারসি</option>
            <option value="ms">মালায়</option>
            <option value="id">ইন্দোনেশিয়ান</option>
            <option value="nl">ডাচ</option>
            <option value="th">থাই</option>
          </select>
        </div>
        <textarea id="bvt-tl-input" placeholder="এখানে লিখুন বা সিলেক্ট করুন..."></textarea>
        <button id="bvt-tl-go">▶ অনুবাদ করুন</button>
        <div id="bvt-tl-output-wrap">
          <div id="bvt-tl-output"></div>
          <div id="bvt-tl-actions">
            <button id="bvt-tl-copy">📋 কপি</button>
            <button id="bvt-tl-insert">✏️ ঢোকাও</button>
          </div>
        </div>
      </div>

      <div id="bvt-emoji-panel">
        <div id="bvt-emoji-grid"></div>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const widget       = document.getElementById('bvt-widget');
  const micBtn        = document.getElementById('bvt-mic');
  const statusEl      = document.getElementById('bvt-status');
  const emojiBtn      = document.getElementById('bvt-emoji-btn');
  const emojiPanel    = document.getElementById('bvt-emoji-panel');
  const emojiGrid     = document.getElementById('bvt-emoji-grid');
  const translateBtn  = document.getElementById('bvt-translate-btn');
  const translatePanel= document.getElementById('bvt-translate-panel');
  const tlInput       = document.getElementById('bvt-tl-input');
  const tlGo          = document.getElementById('bvt-tl-go');
  const tlOutput      = document.getElementById('bvt-tl-output');
  const tlOutputWrap  = document.getElementById('bvt-tl-output-wrap');
  const tlCopy        = document.getElementById('bvt-tl-copy');
  const tlInsert      = document.getElementById('bvt-tl-insert');
  const tlFromSel     = document.getElementById('bvt-tl-from');  // <select>
  const tlToSel       = document.getElementById('bvt-tl-to');    // <select>
  const tlSwap        = document.getElementById('bvt-tl-swap');

  // ─── Translate Language Logic ──────────────────────────────────
  // Swap: exchange the two dropdown values, move result back to input
  tlSwap.addEventListener('click', (e) => {
    e.stopPropagation();
    const prevFrom = tlFromSel.value;
    const prevTo   = tlToSel.value;
    // Move translated text back to input
    const outText = tlOutput.textContent.trim();
    if (outText) {
      tlInput.value = outText;
      tlOutput.textContent = '';
      tlOutputWrap.style.display = 'none';
    }
    // Swap dropdown selections (can't set 'auto' as target)
    const newFrom = prevTo === 'auto' ? 'bn' : prevTo;
    const newTo   = prevFrom === 'auto' ? 'bn' : prevFrom;
    tlFromSel.value = newFrom;
    tlToSel.value   = newTo;
  });

  // Set dropdowns to sensible defaults when opening panel (but don't override user choices)
  let tlDefaultsSet = false;
  function syncTlFromVoiceLang() {
    if (tlDefaultsSet) return;  // user has already chosen — don't override
    if (currentLang === 'bn-BD') { tlFromSel.value = 'auto'; tlToSel.value = 'bn'; }
    else                          { tlFromSel.value = 'auto'; tlToSel.value = 'en'; }
  }
  // Once user touches either dropdown, lock them
  tlFromSel.addEventListener('change', () => { tlDefaultsSet = true; });
  tlToSel.addEventListener('change',   () => { tlDefaultsSet = true; });

  // Open / close translate panel
  translateBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = translatePanel.classList.contains('visible');
    // Close other panels
    emojiPanel.classList.remove('visible');
    if (isOpen) {
      translatePanel.classList.remove('visible');
      return;
    }
    translatePanel.classList.add('visible');
    syncTlFromVoiceLang();
    // Pre-fill with page selection
    const sel = window.getSelection()?.toString().trim();
    if (sel) {
      tlInput.value = sel;
      tlOutput.textContent = '';
      tlOutputWrap.style.display = 'none';
    }
    tlInput.focus();
  });

  // Translate function — reads language directly from dropdowns
  async function doTranslate() {
    const text   = tlInput.value.trim();
    const srcLang = tlFromSel.value;
    const tgtLang = tlToSel.value;
    if (!text) return;
    tlGo.disabled = true;
    tlGo.textContent = '⏳ অনুবাদ হচ্ছে...';
    tlOutput.textContent = '';
    tlOutputWrap.style.display = 'none';

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${srcLang}&tl=${tgtLang}&dt=t&q=${encodeURIComponent(text)}`;
      const res  = await fetch(url);
      const data = await res.json();
      const translated = data[0].map(seg => seg[0]).join('');
      tlOutput.textContent = translated;
      tlOutputWrap.style.display = 'flex';
    } catch (err) {
      tlOutput.textContent = '⚠️ অনুবাদ ব্যর্থ হয়েছে। ইন্টারনেট চেক করুন।';
      tlOutputWrap.style.display = 'flex';
    } finally {
      tlGo.disabled = false;
      tlGo.textContent = '▶ অনুবাদ করুন';
    }
  }

  tlGo.addEventListener('click', (e) => { e.stopPropagation(); doTranslate(); });

  // Translate on Enter (Ctrl+Enter inside textarea)
  tlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      doTranslate();
    }
  });

  // Copy
  tlCopy.addEventListener('click', (e) => {
    e.stopPropagation();
    const t = tlOutput.textContent.trim();
    if (!t) return;
    navigator.clipboard.writeText(t).then(() => {
      tlCopy.textContent = '✓ কপি হয়েছে!';
      setTimeout(() => { tlCopy.textContent = '📋 কপি'; }, 1500);
    });
  });

  // Insert at cursor
  tlInsert.addEventListener('click', (e) => {
    e.stopPropagation();
    const t = tlOutput.textContent.trim();
    if (!t) return;
    const target = activeInput || findInput();
    if (!target) { showStatus('আগে text box-এ ক্লিক করুন', 2000); return; }
    typeInto(target, t);
    translatePanel.classList.remove('visible');
    showStatus('অনুবাদ ঢোকানো হয়েছে ✓', 1800);
  });


  const emojiList = [
    // Smileys & emotions (existing + new)
    '😀', '😂', '🥰', '😎', '🤔', '🙄', '😭', '🙏', '👍', '❤️', '🔥', '✅', '🎉', '✨', '👀', '💯', '🙌', '👏', '😊', '😉', '😍', '🤩', '😘', '😜', '🤫', '🤗', '🤭', '🥳', '😔', '😕', '😒', '😡', '🤬', '🤯', '🥶', '🥵', '👋', '✌️', '🤘', '🤞', '🤙', '👎', '🤝', '🎁', '💡', '🚀',

    // Additional popular emojis
    '💀', '👻', '🎃', '😈', '👿', '🤡', '💩', '👽', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',

    // Hearts & emotions
    '💔', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💗', '💓', '💖', '💘', '💝',

    // Gestures & people
    '🙋', '🙆', '🙅', '🤷', '🤦', '🙇', '👌', '🤌', '🤏', '🫰', '🫱', '🫲', '🫳', '🫴', '🫶',

    // Animals & nature
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐴', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪱', '🦟', '🐙', '🦑', '🪼', '🐬', '🐳', '🐋', '🦈', '🌲', '🌵', '🌸', '🌼', '🌻', '🌺', '🌹', '💐',

    // Food & drink
    '🍎', '🍕', '🍔', '🍟', '🌮', '🌯', '🥗', '🍣', '🍩', '🍪', '☕', '🍺', '🍻', '🥂', '🥃', '🍷', '🧋', '🥤', '🧃',

    // Activities & objects
    '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎮', '🎲', '🎯', '🎳', '🎨', '🎭', '🎪', '🎬', '📷', '📸', '📱', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '📀', '💿', '📹', '🎥', '📞', '📺', '🕹️',

    // Travel & places
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '✈️', '🚀', '🛸', '🚁', '⛵', '🚢', '🚤', '🚲', '🛴', '🏍️', '🚂', '🚆', '🚇', '🚉',

    // Flags & symbols
    '🏳️', '🏴', '🏁', '🚩', '🎌', '🏴‍☠️', '🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇯🇵', '🇰🇷', '🇨🇳', '🇮🇳', '🇫🇷', '🇩🇪', '🇮🇹', '🇪🇸', '🇧🇷', '🇲🇽',

    // More everyday emojis
    '💪', '🦵', '🦶', '👂', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '👤', '👥', '🗣️', '👶', '🧒', '👦', '👧', '🧑', '👩', '👨', '🧔', '👵', '🧓', '🙍', '🙎', '💁', '🙋', '🧏', '🙇', '🤲', '🧑‍🤝‍🧑', '👭', '👬', '👫'
  ];

  emojiList.forEach(em => {
    const span = document.createElement('span');
    span.textContent = em;
    span.className = 'bvt-emoji-item';
    emojiGrid.appendChild(span);
  });

  // Prevent focus theft when clicking non-interactive parts of the widget
  widget.addEventListener('mousedown', (e) => {
    const tag = e.target.tagName;
    const interactive = ['SELECT', 'TEXTAREA', 'INPUT', 'BUTTON', 'OPTION'];
    if (!interactive.includes(tag)) {
      e.preventDefault();
    }
  });

  // Emoji Panel Toggle — also closes translate panel
  emojiBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    translatePanel.classList.remove('visible');
    emojiPanel.classList.toggle('visible');
  });

  // Insert Emoji
  emojiGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('bvt-emoji-item')) {
      e.stopPropagation();
      const em = e.target.textContent;
      const target = activeInput || findInput();
      if (!target) {
        showStatus('আগে text box-এ ক্লিক করুন', 2200);
        return;
      }
      typeInto(target, em);
    }
  });

  // Click outside to hide any open panel
  document.addEventListener('mousedown', (e) => {
    if (!widget.contains(e.target)) {
      emojiPanel.classList.remove('visible');
      translatePanel.classList.remove('visible');
    }
  });

  // ─── Apply Theme ──────────────────────────────────────────────
  function applyTheme(themeName, customColors) {
    const t = THEMES[themeName] || THEMES.dark;
    // Override theme values with custom colors if provided
    const bg     = (customColors && customColors.widgetBg)    || t.bg;
    const border = (customColors && customColors.borderColor) ? customColors.borderColor + '88' : t.border;
    const mic    = (customColors && customColors.micBg)       || t.mic;
    const accent = (customColors && customColors.accentColor) || t.accent;
    const text   = (customColors && customColors.textColor)   || t.text;
    const sub    = t.sub;
    const accentB = t.accentB;
    const surface = t.surface;
    document.getElementById('bvt-theme-style').textContent = `
      #bvt-widget {
        background: ${bg};
        border-color: ${border};
        box-shadow: 0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px ${border};
      }
      #bvt-drag-handle { color: ${sub}; }
      .bvt-lang { color: ${sub}; }
      .bvt-lang.active { background: linear-gradient(135deg, ${accent}, ${accentB}); color: ${text}; }
      #bvt-mic { background: linear-gradient(135deg, ${mic}, ${t.micB}); color: ${sub}; }
      #bvt-mic:hover { color: ${text}; box-shadow: 0 4px 18px ${accent}44; }
      #bvt-status { color: ${sub}; }
      #bvt-emoji-panel { background: ${surface}; border-color: ${border}; }
      .bvt-emoji-item:hover { background: ${border}; transform: scale(1.15); }
      #bvt-minimize { color: ${text}; border-color: ${border}; }
      #bvt-translate-btn { border-color: ${accent}33; color: ${sub}; }
      #bvt-translate-btn:hover { background: ${accent}33; border-color: ${accent}66; color: ${text}; }
      #bvt-translate-panel { background: ${surface}; border-color: ${border}; }
      #bvt-tl-go { background: linear-gradient(135deg, ${accent}, ${accentB}); }
      #bvt-tl-output { border-color: ${accent}33; background: ${accent}11; }
      #bvt-tl-insert { color: ${accent}; border-color: ${accent}33; background: ${accent}11; }
      #bvt-tl-insert:hover { background: ${accent}2a; border-color: ${accent}55; color: ${text}; }
      #bvt-tl-from, #bvt-tl-to {
        background-color: ${bg};
        color: ${text};
        border-color: ${border};
      }
      #bvt-tl-from option, #bvt-tl-to option {
        background: ${surface};
        color: ${text};
      }
      #bvt-tl-from:hover, #bvt-tl-to:hover { border-color: ${accent}66; background-color: ${accent}18; }
      #bvt-tl-from:focus, #bvt-tl-to:focus { border-color: ${accent}99; }
      #bvt-tl-swap { color: ${sub}; border-color: ${border}; background: ${bg}; }
      #bvt-tl-swap:hover { background: ${accent}22; color: ${text}; border-color: ${accent}55; }
      .bvt-active-box {
        outline: 2.5px solid ${accent} !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px ${accent}22 !important;
        transition: outline 0.2s, box-shadow 0.2s !important;
      }
    `;
  }

  // ─── Load Settings & Init ─────────────────────────────────────
  chrome.storage.local.get({ theme: 'dark', autoPunct: true, highlight: true, collapsed: false, customColors: null }, (s) => {
    settings = s;
    applyTheme(s.theme, s.customColors);
    setLang(currentLang);
    if (s.collapsed) {
      widget.classList.add('bvt-collapsed');
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SETTINGS_UPDATED') {
      settings = { ...settings, ...msg.settings };
      applyTheme(settings.theme, msg.settings.customColors || settings.customColors);
    }
  });

  // ─── Collapse / Expand logic ──────────────────────────────────
  document.getElementById('bvt-minimize').addEventListener('click', (e) => {
    e.stopPropagation();
    widget.classList.add('bvt-collapsed');
    emojiPanel.classList.remove('visible');
    translatePanel.classList.remove('visible');
    chrome.storage.local.set({ collapsed: true });
  });

  widget.addEventListener('click', (e) => {
    if (widget.classList.contains('bvt-collapsed')) {
      widget.classList.remove('bvt-collapsed');
      chrome.storage.local.set({ collapsed: false });
    }
  });

  // ─── Dragging ─────────────────────────────────────────────────
  let drag = false, dsx, dsy, dwx, dwy;
  document.getElementById('bvt-drag-handle').addEventListener('mousedown', (e) => {
    drag = true; dsx = e.clientX; dsy = e.clientY;
    const r = widget.getBoundingClientRect();
    dwx = r.left; dwy = r.top;
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!drag) return;
    widget.style.left = (dwx + e.clientX - dsx) + 'px';
    widget.style.top = (dwy + e.clientY - dsy) + 'px';
    widget.style.right = widget.style.bottom = 'auto';
  });
  document.addEventListener('mouseup', () => { drag = false; document.body.style.userSelect = ''; });

  // ─── Language ─────────────────────────────────────────────────
  function setLang(lang) {
    currentLang = lang;
    document.querySelectorAll('.bvt-lang').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
  }

  document.querySelectorAll('.bvt-lang').forEach(btn => btn.addEventListener('click', () => {
    setLang(btn.dataset.lang);
    if (isListening) { stopListening(); setTimeout(startListening, 300); }
    showStatus(currentLang === 'bn-BD' ? 'বাংলা মোড' : 'English Mode', 1200);
  }));

  function showStatus(msg, duration) {
    statusEl.textContent = msg;
    if (duration) setTimeout(() => { statusEl.textContent = isListening ? 'শুনছি...' : 'ক্লিক করুন'; }, duration);
  }

  // ─── Active Input Highlight ───────────────────────────────────
  let prevHighlighted = null;

  function highlightInput(el) {
    if (!settings.highlight) return;
    if (prevHighlighted && prevHighlighted !== el) {
      prevHighlighted.classList.remove('bvt-active-box');
    }
    if (el) {
      el.classList.add('bvt-active-box');
      prevHighlighted = el;
    }
  }

  function clearHighlight() {
    if (prevHighlighted) {
      prevHighlighted.classList.remove('bvt-active-box');
      prevHighlighted = null;
    }
  }

  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (el && (el.isContentEditable || el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
      activeInput = el;
      if (isListening) highlightInput(el);
    }
  });

  // ─── Find input ───────────────────────────────────────────────
  function findInput() {
    if (activeInput && document.contains(activeInput)) return activeInput;
    const f = document.activeElement;
    if (f && (f.isContentEditable || f.tagName === 'TEXTAREA' || f.tagName === 'INPUT') && f.id !== 'bvt-mic') return f;
    for (const s of ['[data-lexical-editor="true"]', '[contenteditable="true"]', '[role="textbox"]', 'textarea']) {
      const el = document.querySelector(s);
      if (el) return el;
    }
    return null;
  }

  // ─── Type into Field ───────────────────────────────────────
  function typeInto(target, text) {
    if (!target) return;
    if (target !== document.activeElement) {
      target.focus();
    }

    if (target.isContentEditable) {
      // Using execCommand is the only reliable way to insert text into React/Lexical 
      // editors like Facebook's while preserving internal state and cursor position.
      document.execCommand('insertText', false, text);
    } else {
      const s = target.selectionStart ?? target.value.length;
      // Use execCommand for textarea/input as well if possible, 
      // but manual slice is safe there since it's just a raw value.
      target.value = target.value.slice(0, s) + text + target.value.slice(s);
      target.selectionStart = target.selectionEnd = s + text.length;
      target.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // ─── Speech Recognition ───────────────────────────────────────
  function buildRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showStatus('সাপোর্ট নেই!'); micBtn.disabled = true; return null; }
    const r = new SR();
    r.lang = currentLang;
    r.continuous = true;
    r.interimResults = true;

    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) continue;
        const raw = e.results[i][0].transcript;
        const punctuated = autoPunctuate(raw, currentLang);
        const chunk = punctuated + ' ';
        typeInto(activeInput || findInput(), chunk);
      }
    };

    r.onerror = (e) => {
      if (e.error === 'not-allowed') { showStatus('মাইক অনুমতি দিন!'); stopListening(); }
      else if (e.error !== 'no-speech') { showStatus('সমস্যা হয়েছে'); stopListening(); }
    };

    r.onend = () => { if (isListening) { try { r.start(); } catch (_) { } } };
    return r;
  }

  function startListening() {
    const target = findInput();
    if (!target) { showStatus('আগে text box-এ ক্লিক করুন', 2200); return; }
    activeInput = target;
    highlightInput(target);

    recognition = buildRecognition();
    if (!recognition) return;
    recognition.lang = currentLang;

    try {
      recognition.start();
      isListening = true;
      micBtn.classList.add('listening');
      showStatus('শুনছি...');
    } catch { showStatus('শুরু করা যায়নি'); }
  }

  function stopListening() {
    isListening = false;
    if (recognition) { try { recognition.stop(); } catch (_) { } recognition = null; }
    micBtn.classList.remove('listening');
    clearHighlight();
    statusEl.textContent = 'ক্লিক করুন';
  }

  micBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // prevent parent click
    if (isListening) stopListening();
    else startListening();
  });

})();
