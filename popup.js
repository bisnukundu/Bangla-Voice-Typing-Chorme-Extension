// popup.js

const DEFAULTS = {
  theme: 'dark',
  autoPunct: true,
  highlight: true,
  customColors: null   // null = use theme colors
};

// Default colors per theme
const THEME_COLORS = {
  dark:     { widgetBg: '#0a0a0f', borderColor: '#2a2a3e', micBg: '#1a1a2e', accentColor: '#4f7df3', textColor: '#e8e8f0' },
  midnight: { widgetBg: '#0d1117', borderColor: '#1e2530', micBg: '#161b22', accentColor: '#58a6ff', textColor: '#c9d1d9' },
  ocean:    { widgetBg: '#0a1628', borderColor: '#163858', micBg: '#0e2040', accentColor: '#38bdf8', textColor: '#b8d4f0' },
  forest:   { widgetBg: '#0a1a0f', borderColor: '#1a3820', micBg: '#122818', accentColor: '#4ade80', textColor: '#b8d4bc' },
  sunset:   { widgetBg: '#1a0a0f', borderColor: '#3d1830', micBg: '#2d1020', accentColor: '#f87171', textColor: '#f0c8d0' },
  light:    { widgetBg: '#f0f0f5', borderColor: '#ccccdd', micBg: '#e0e0f0', accentColor: '#4f7df3', textColor: '#1a1a2e' }
};

// Current working custom colors (may be from storage or derived from theme)
let currentColors = { ...THEME_COLORS['dark'] };
let activeTheme = 'dark';

// ─── Color Key → Element ids ──────────────────────────────────
const COLOR_KEYS = ['widgetBg', 'borderColor', 'micBg', 'accentColor', 'textColor'];

// Utility: hex → valid 6-char hex
function toHex6(val) {
  val = val.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(val)) return val;
  if (/^[0-9a-fA-F]{6}$/.test(val)) return '#' + val;
  if (/^#[0-9a-fA-F]{3}$/.test(val)) {
    const [, r, g, b] = val;
    return '#' + r+r + g+g + b+b;
  }
  return null;
}

// ─── Sync UI from currentColors ─────────────────────────────
function syncColorUI() {
  COLOR_KEYS.forEach(key => {
    const hexVal = currentColors[key] || '#888888';
    const picker = document.getElementById('color-' + key);
    const hexInput = document.getElementById('hex-' + key);
    const preview = document.getElementById('prev-' + key);
    if (picker) picker.value = hexVal;
    if (hexInput) hexInput.value = hexVal;
    if (preview) preview.style.background = hexVal;
  });
  updatePreviewBubble();
}

// ─── Live preview bubble ─────────────────────────────────────
function updatePreviewBubble() {
  const bubble = document.getElementById('previewBubble');
  if (!bubble) return;
  bubble.style.background = currentColors.widgetBg || '#0a0a0f';
  bubble.style.borderColor = currentColors.borderColor || '#2a2a3e';
  bubble.style.color = currentColors.textColor || '#e8e8f0';
  bubble.style.boxShadow = `0 6px 20px rgba(0,0,0,0.5), 0 0 0 2px ${currentColors.accentColor || '#4f7df3'}44`;
}

// ─── Wire up color pickers ────────────────────────────────────
COLOR_KEYS.forEach(key => {
  const picker = document.getElementById('color-' + key);
  const hexInput = document.getElementById('hex-' + key);
  const preview = document.getElementById('prev-' + key);

  if (picker) {
    picker.addEventListener('input', () => {
      currentColors[key] = picker.value;
      if (hexInput) hexInput.value = picker.value;
      if (preview) preview.style.background = picker.value;
      updatePreviewBubble();
    });
  }

  if (hexInput) {
    hexInput.addEventListener('input', () => {
      const hex = toHex6(hexInput.value);
      if (hex) {
        currentColors[key] = hex;
        if (picker) picker.value = hex;
        if (preview) preview.style.background = hex;
        updatePreviewBubble();
      }
    });
  }
});

// ─── Load saved settings ──────────────────────────────────────
chrome.storage.local.get(DEFAULTS, (s) => {
  // Theme
  activeTheme = s.theme || 'dark';
  document.querySelectorAll('.theme-card').forEach(c => {
    c.classList.toggle('active', c.dataset.theme === activeTheme);
  });

  // Toggles
  document.getElementById('autoPunctToggle').checked = s.autoPunct;
  document.getElementById('highlightToggle').checked = s.highlight;

  // Colors: use saved customColors, or derive from theme
  if (s.customColors) {
    currentColors = { ...THEME_COLORS[activeTheme], ...s.customColors };
  } else {
    currentColors = { ...THEME_COLORS[activeTheme] };
  }

  syncColorUI();
});

// ─── Theme click ──────────────────────────────────────────────
document.getElementById('themeGrid').addEventListener('click', (e) => {
  const card = e.target.closest('.theme-card');
  if (!card) return;
  document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  activeTheme = card.dataset.theme;

  // When switching theme, reset custom colors to the new theme's defaults
  currentColors = { ...THEME_COLORS[activeTheme] };
  syncColorUI();
});

// ─── Reset Colors btn ────────────────────────────────────────
document.getElementById('resetColorsBtn').addEventListener('click', () => {
  currentColors = { ...THEME_COLORS[activeTheme] };
  syncColorUI();
  const btn = document.getElementById('resetColorsBtn');
  btn.textContent = '✓ রিসেট হয়েছে!';
  setTimeout(() => { btn.textContent = '↺ থিম অনুযায়ী রিসেট করুন'; }, 1500);
});

// ─── Save ────────────────────────────────────────────────────
document.getElementById('saveBtn').addEventListener('click', () => {
  const theme      = document.querySelector('.theme-card.active')?.dataset.theme || 'dark';
  const autoPunct  = document.getElementById('autoPunctToggle').checked;
  const highlight  = document.getElementById('highlightToggle').checked;
  const customColors = { ...currentColors };

  chrome.storage.local.set({ theme, autoPunct, highlight, customColors }, () => {
    const btn = document.getElementById('saveBtn');
    btn.textContent = '✓ সেভ হয়েছে!';
    setTimeout(() => { btn.textContent = '✓ সেভ করুন'; }, 1800);

    // Notify all active tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_UPDATED',
          settings: { theme, autoPunct, highlight, customColors }
        }).catch(() => {});
      });
    });
  });
});
