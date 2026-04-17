# 🎙️ বাংলা ভয়েস টাইপিং — Bangla Voice Typing

> A powerful Chrome Extension for voice-based typing in **Bangla and English** on any website — with built-in translation, emoji picker, custom themes, and more.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Manifest](https://img.shields.io/badge/Manifest-V3-green)
![License](https://img.shields.io/badge/license-MIT-purple)
![Platform](https://img.shields.io/badge/platform-Chrome-yellow)

---

## 📌 Overview

**বাংলা ভয়েস টাইপিং** is a floating widget that appears on every webpage. Simply speak — and your words appear directly in any text box on the page. No typing required. Works on Facebook, Gmail, Google Docs, WhatsApp Web, and all other websites.

---

## ✨ Features

### 🎤 Voice Typing
- Speak in **Bangla (bn-BD)** or **English (en-US)** — switchable with a single tap
- **Continuous listening** — keeps recording until you stop it
- Inserts text precisely at your **cursor position** in any input field
- Works with complex editors including **React, Lexical (Facebook)**, and standard `<textarea>` / `<input>` fields
- **Auto Punctuation** — automatically adds `।`, `?`, `.` to complete sentences (no AI required)

### 🌐 Built-in Translator
- Translate text using **Google Translate** (no API key needed)
- Supports **20 languages**:
  - বাংলা, ইংরেজি, হিন্দি, আরবি, চীনা, ফরাসি, জার্মান, স্প্যানিশ
  - পর্তুগিজ, রুশিয়ান, জাপানি, কোরিয়ান, তুর্কি, ইতালিয়ান
  - উর্দু, ফারসি, মালায়, ইন্দোনেশিয়ান, ডাচ, থাই
- **Select text on any page** → click translate → auto-fills the panel
- **⇄ Swap** button to reverse source and target language
- **Copy** or **Insert at cursor** the translated result instantly
- Shortcut: `Ctrl + Enter` inside the panel to translate quickly

### 😊 Emoji Picker
- 150+ emoji across categories: faces, gestures, animals, food, flags, travel, and more
- Click any emoji to insert it at the active cursor position

### 🎨 Themes & Custom Colors
- **6 built-in themes**: Dark, Midnight, Ocean, Forest, Sunset, Light
- **Custom Color Panel** — independently change:
  - Widget background
  - Border color
  - Mic button color
  - Accent / highlight color
  - Text color
- Live preview bubble updates in real time as you pick colors
- **Reset** to any theme's defaults with one click

### 🖱️ Draggable & Collapsible
- Drag the widget anywhere on screen using the `⠿` handle
- **Minimize** to a small floating circle to save screen space
- Hover the minimized widget to see a "ক্লিক করুন" tooltip
- Click the circle to expand back to full widget

### ⚙️ Settings Panel (Popup)
- Toggle **Auto Punctuation** on/off
- Toggle **Active Input Box Highlight** (glows around the text field being typed into)
- Changes sync instantly to the active page — no reload needed

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Platform | Chrome Extension (Manifest V3) |
| Content Script | Vanilla JavaScript |
| Speech Recognition | Web Speech API (`SpeechRecognition`) |
| Translation | Google Translate unofficial API |
| Styling | Vanilla CSS with CSS Variables |
| Storage | `chrome.storage.local` |
| Font | Noto Sans Bengali (Google Fonts) |

---

## 📦 Installation (Developer Mode)

Since this extension is not on the Chrome Web Store, install it manually:

### Step 1 — Download the Extension

```bash
git clone https://github.com/your-username/bangla-voice-extension.git
```

Or download the ZIP and extract it.

### Step 2 — Open Chrome Extensions Page

1. Open **Google Chrome**
2. Go to the address bar and type:
   ```
   chrome://extensions
   ```
3. Press **Enter**

### Step 3 — Enable Developer Mode

- In the top-right corner of the Extensions page, toggle **Developer mode** → `ON`

### Step 4 — Load the Extension

1. Click the **"Load unpacked"** button (top-left)
2. Browse to the folder where you extracted/cloned the extension
3. Select the `bangla-voice-extension` folder
4. Click **"Select Folder"**

### Step 5 — Pin the Extension (Optional)

1. Click the **puzzle piece icon** 🧩 in Chrome toolbar
2. Find **"বাংলা ভয়েস টাইপিং"**
3. Click the **pin icon** 📌 to keep it visible

---

## 🚀 How to Use

### 🎤 Voice Typing — Step by Step

1. **Open any website** (Facebook, Gmail, Google Docs, etc.)
2. The floating widget appears on the **bottom-right** of the screen
3. **Click inside a text box** on the page where you want to type
4. **Select your language** from the widget:
   - `বাং` → Bangla mode
   - `ENG` → English mode
5. **Click the microphone button** 🎙️ — it turns red and starts listening
6. **Speak** — your words appear in the text box in real time
7. **Click the microphone again** to stop

> **Tip:** The active text box will glow with a colored outline so you know where text is going.

---

### 🌐 Translator — Step by Step

1. **Optional:** Select/highlight any text on the page first
2. Click the **"অনুবাদ" button** on the widget
3. The translation panel slides open — selected text is auto-filled in the input
4. **Choose source language** from the left dropdown (default: স্বয়ংক্রিয় = auto-detect)
5. **Choose target language** from the right dropdown (default: বাংলা)
6. Click **"▶ অনুবাদ করুন"** or press `Ctrl + Enter`
7. The translation appears below
8. Use the action buttons:
   - **📋 কপি** — copies the translation to clipboard
   - **✏️ ঢোকাও** — inserts the translation directly into the last active text box

> **Swap:** Click **⇄** to flip source and target languages. The translated text moves back to the input automatically.

---

### 😊 Emoji Picker — Step by Step

1. Click the **😊 emoji button** in the top corner of the widget
2. The emoji panel slides open to the left
3. **Scroll** to browse categories
4. **Click any emoji** — it is inserted at your cursor position instantly

---

### 🎨 Custom Theme — Step by Step

1. Click the **extension icon** in the Chrome toolbar (or the puzzle piece 🧩)
2. The **Settings popup** opens
3. Under **"🎨 কালার থিম"** — click any of the 6 theme cards to select it
4. Under **"🖌️ কাস্টম কালার"** — use the color pickers to customize individual parts:
   - Click the **color swatch** to open a color picker
   - Or type a **hex code** directly (e.g. `#ff6b6b`)
5. Watch the **preview bubble** update live
6. Click **"↺ থিম অনুযায়ী রিসেট করুন"** to revert to the selected theme's defaults
7. Click **"✓ সেভ করুন"** — changes apply instantly on the page

---

### ⚙️ Settings — Step by Step

1. Click the **extension icon** in Chrome toolbar
2. Under **"⚙️ ফিচার"**:
   - Toggle **🔤 অটো পাঞ্চুয়েশন** — adds punctuation marks automatically
   - Toggle **🎯 Active Box Highlight** — shows which input box is being typed into
3. Click **"✓ সেভ করুন"**

---

### 🖱️ Minimize & Move the Widget

| Action | How |
|---|---|
| **Move** | Drag the `⠿` handle at the top |
| **Minimize** | Click the `−` button (top right of widget) |
| **Expand** | Click the small floating circle |

---

## ❓ Troubleshooting

| Problem | Solution |
|---|---|
| Microphone not working | Click "Allow" when Chrome asks for microphone permission. Check `chrome://settings/content/microphone` |
| Text not appearing in box | Click inside the text box first, then start the mic |
| Translation fails | Check your internet connection. The translator requires internet access |
| Widget not showing | Reload the page. If needed, go to `chrome://extensions` and reload the extension |
| Speech not recognized | Make sure you are using Chrome (Firefox does not support Web Speech API) |

---

## 🔐 Permissions Used

| Permission | Reason |
|---|---|
| `activeTab` | To communicate between popup and the active web page |
| `storage` | To save your theme, colors, and settings locally |
| `<all_urls>` (host permission) | To inject the voice widget on all websites |
| Microphone (runtime) | For speech recognition — only active while the mic button is on |

> ⚠️ No data is sent to any external server. All settings are stored locally in your browser via `chrome.storage.local`. Translation requests go directly from your browser to Google Translate's public endpoint.

---

## 📁 File Structure

```
bangla-voice-extension/
├── manifest.json       # Extension configuration (Manifest V3)
├── content.js          # Main widget: voice, translate, emoji logic
├── style.css           # Widget styling and animations
├── popup.html          # Settings popup UI
├── popup.js            # Settings popup logic
├── icon16.png          # Extension icons
├── icon48.png
└── icon128.png
```

---

## 🙏 Credits
- **Developer**: [Bishnu Kundu](https://bisnukundu.netlify.app/) 
- **Speech Recognition**: [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) by W3C
- **Translation**: [Google Translate](https://translate.google.com)
- **Font**: [Noto Sans Bengali](https://fonts.google.com/noto/specimen/Noto+Sans+Bengali) by Google Fonts

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<p align="center">Made with ❤️ for Bangla speakers everywhere</p>
